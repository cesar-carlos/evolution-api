import { RouterBroker } from '@api/abstract/abstract.router';
import { InstanceDto } from '@api/dto/instance.dto';
import { chatController, instanceController } from '@api/server.module';
import { ConfigService } from '@config/env.config';
import { Logger } from '@config/logger.config';
import crypto from 'crypto';
import { RequestHandler, Router } from 'express';
import fs from 'fs';
import path from 'path';

import { HttpStatus } from './index.router';

// Rate limiting simples em memória
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minuto
const RATE_LIMIT_MAX_REQUESTS = 10; // 10 requests por minuto

function rateLimit(req: any, res: any, next: any) {
  const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();

  const clientData = rateLimitMap.get(clientIp);

  if (!clientData || now > clientData.resetTime) {
    rateLimitMap.set(clientIp, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return next();
  }

  if (clientData.count >= RATE_LIMIT_MAX_REQUESTS) {
    return res.status(429).json({
      error: 'Too many requests',
      message: 'Rate limit exceeded. Try again later.',
      retryAfter: Math.ceil((clientData.resetTime - now) / 1000),
    });
  }

  clientData.count++;
  next();
}

export class QrcodeRouter extends RouterBroker {
  private readonly logger = new Logger('QrcodeRouter');

  constructor(
    readonly configService: ConfigService,
    ...guards: RequestHandler[]
  ) {
    super();

    // Endpoint seguro para verificar se a API está configurada (sem expor a chave)
    this.router.get('/api-key', async (req, res) => {
      try {
        const auth = this.configService.get('AUTHENTICATION');
        let isConfigured = false;
        let sessionToken = '';

        if (auth && auth.API_KEY && typeof auth.API_KEY.KEY === 'string') {
          const apiKey = auth.API_KEY.KEY;
          isConfigured = !!apiKey && apiKey !== 'BQYHJGJHJ';

          // Gera um token de sessão temporário em vez de expor a chave master
          if (isConfigured) {
            sessionToken = crypto.randomBytes(32).toString('hex');
            // Armazena o token temporário (em produção, usar Redis ou cache distribuído)
            this.storeTemporaryToken(sessionToken, apiKey);
          }
        }

        this.logger.log(`API Key status checked: ${isConfigured ? 'Configured' : 'Not configured'}`);

        res.json({
          configured: isConfigured,
          sessionToken: sessionToken, // Token temporário em vez da chave master
          expiresIn: 3600, // 1 hora
        });
      } catch (error) {
        this.logger.error(`Error checking API key status: ${error.message}`);
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ configured: false, error: 'Internal server error' });
      }
    });

    // Endpoint para trocar o token de sessão pela chave real (apenas para uso interno)
    this.router.post('/exchange-token', rateLimit, async (req, res) => {
      try {
        const { sessionToken } = req.body;

        if (!sessionToken) {
          return res.status(400).json({ error: 'Session token required' });
        }

        const apiKey = this.getApiKeyFromToken(sessionToken);

        if (!apiKey) {
          return res.status(401).json({ error: 'Invalid or expired session token' });
        }

        res.json({ apiKey });
      } catch (error) {
        this.logger.error(`Error exchanging token: ${error.message}`);
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Internal server error' });
      }
    });

    this.router
      .get('/', async (req, res) => {
        // Serve the QR code HTML page with security headers
        const qrcodeHtmlPath = path.join(process.cwd(), 'public', 'qrcode', 'index.html');
        try {
          const htmlContent = fs.readFileSync(qrcodeHtmlPath, 'utf8');

          // Adiciona headers de segurança
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.setHeader('X-Content-Type-Options', 'nosniff');
          res.setHeader('X-Frame-Options', 'DENY');
          res.setHeader('X-XSS-Protection', '1; mode=block');
          res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

          res.send(htmlContent);
        } catch (error) {
          this.logger.error(`Error serving QR code page: ${error.message}`);
          res
            .status(HttpStatus.INTERNAL_SERVER_ERROR)
            .json({ status: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Error loading QR code page' });
        }
      })
      .get('/connect/:instanceName', ...guards, async (req, res) => {
        const response = await this.dataValidate<InstanceDto>({
          request: req,
          schema: null,
          ClassRef: InstanceDto,
          execute: () => instanceController.connectToWhatsapp({ instanceName: req.params.instanceName }),
        });

        return res.status(HttpStatus.OK).json(response);
      })
      .get('/connectionState/:instanceName', ...guards, async (req, res) => {
        const response = await this.dataValidate<InstanceDto>({
          request: req,
          schema: null,
          ClassRef: InstanceDto,
          execute: () => instanceController.connectionState({ instanceName: req.params.instanceName }),
        });

        return res.status(HttpStatus.OK).json(response);
      })
      .delete('/logout/:instanceName', ...guards, async (req, res) => {
        const response = await this.dataValidate<InstanceDto>({
          request: req,
          schema: null,
          ClassRef: InstanceDto,
          execute: () => instanceController.logout({ instanceName: req.params.instanceName }),
        });

        return res.status(HttpStatus.OK).json(response);
      })
      // Rotas adicionais para operações de perfil
      .get('/fetchInstances', ...guards, async (req, res) => {
        const response = await this.dataValidate<InstanceDto>({
          request: req,
          schema: null,
          ClassRef: InstanceDto,
          execute: () =>
            instanceController.fetchInstances(
              { instanceName: req.query.instanceName as string },
              req.headers.apikey as string,
            ),
        });
        return res.status(HttpStatus.OK).json(response);
      })
      .get('/fetchProfile', ...guards, async (req, res) => {
        const response = await this.dataValidate<InstanceDto>({
          request: req,
          schema: null,
          ClassRef: InstanceDto,
          execute: () =>
            chatController.fetchProfile(
              { instanceName: req.query.instanceName as string },
              { number: req.query.instanceName as string },
            ),
        });
        return res.status(HttpStatus.OK).json(response);
      })
      .post('/updateProfileName', ...guards, async (req, res) => {
        const response = await this.dataValidate<InstanceDto>({
          request: req,
          schema: null,
          ClassRef: InstanceDto,
          execute: () =>
            chatController.updateProfileName({ instanceName: req.body.instanceName }, { name: req.body.name }),
        });
        return res.status(HttpStatus.OK).json(response);
      })
      .post('/updateProfileStatus', ...guards, async (req, res) => {
        const response = await this.dataValidate<InstanceDto>({
          request: req,
          schema: null,
          ClassRef: InstanceDto,
          execute: () =>
            chatController.updateProfileStatus({ instanceName: req.body.instanceName }, { status: req.body.status }),
        });
        return res.status(HttpStatus.OK).json(response);
      })
      .post('/updateProfilePicture', ...guards, async (req, res) => {
        const response = await this.dataValidate<InstanceDto>({
          request: req,
          schema: null,
          ClassRef: InstanceDto,
          execute: () =>
            chatController.updateProfilePicture({ instanceName: req.body.instanceName }, { picture: req.body.image }),
        });
        return res.status(HttpStatus.OK).json(response);
      });
  }

  // Cache temporário para tokens de sessão (em produção, usar Redis)
  private tokenCache = new Map<string, { apiKey: string; expiresAt: number }>();

  private storeTemporaryToken(sessionToken: string, apiKey: string) {
    const expiresAt = Date.now() + 3600 * 1000; // 1 hora
    this.tokenCache.set(sessionToken, { apiKey, expiresAt });

    // Limpa tokens expirados
    setTimeout(() => {
      this.tokenCache.delete(sessionToken);
    }, 3600 * 1000);
  }

  private getApiKeyFromToken(sessionToken: string): string | null {
    const tokenData = this.tokenCache.get(sessionToken);

    if (!tokenData || Date.now() > tokenData.expiresAt) {
      this.tokenCache.delete(sessionToken);
      return null;
    }

    return tokenData.apiKey;
  }

  public readonly router: Router = Router();
}
