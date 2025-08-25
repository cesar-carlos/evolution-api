# Documentação Nginx para Evolution API

Este diretório contém toda a documentação e arquivos necessários para configurar o Nginx como proxy reverso para a Evolution API no domínio `evo.se7esistemassinop.com.br`.

## Arquivos Criados

### 📚 `nginx-setup.md`
Manual completo e detalhado com instruções passo a passo para:
- Instalação do Nginx
- Configuração de proxy reverso para a Evolution API (porta 8080)
- Configuração de SSL com Let's Encrypt
- Implementação de cabeçalhos de segurança
- Resolução de problemas
- Comandos de manutenção

### ⚙️ `nginx-config-example.conf`
Arquivo de configuração pronta para uso com:
- Redirecionamento HTTP → HTTPS
- Proxy reverso para porta 8080
- Configurações SSL modernas
- Cabeçalhos de segurança
- Suporte a WebSocket
- Cache para arquivos estáticos

### 🚀 `install-nginx.sh`
Script automatizado que executa:
- Instalação do Nginx
- Configuração do firewall
- Criação da configuração do site
- Instalação do Certbot
- Obtenção de certificados SSL
- Configuração de renovação automática

## Como Usar

### Opção 1: Instalação Automatizada (Recomendada)

1. **Edite o script primeiro:**
   ```bash
   nano docs/install-nginx.sh
   # Altere a variável EMAIL para seu email real
   ```

2. **Execute o script:**
   ```bash
   sudo ./docs/install-nginx.sh
   ```

### Opção 2: Instalação Manual

Siga o manual completo em `nginx-setup.md`.

### Opção 3: Usar Configuração Pronta

```bash
# Copiar configuração
sudo cp docs/nginx-config-example.conf /etc/nginx/sites-available/evo.se7esistemassinop.com.br

# Ativar site
sudo ln -s /etc/nginx/sites-available/evo.se7esistemassinop.com.br /etc/nginx/sites-enabled/

# Testar e recarregar
sudo nginx -t && sudo systemctl reload nginx
```

## Informações do Domínio Atual

- **Domínio:** `evo.se7esistemassinop.com.br`
- **IP atual:** Verificar com `dig +short evo.se7esistemassinop.com.br`
- **Evolution API:** Porta 8080 (local)
- **Manager:** `/manager`
- **Documentação:** `/docs`
- **Versão:** 2.3.1

## Estrutura da Configuração

```
Nginx (443/80) → Evolution API (127.0.0.1:8080)
         ↓
    Docker Container
```

## Verificações Pós-Instalação

1. **Nginx funcionando:**
   ```bash
   sudo systemctl status nginx
   ```

2. **Evolution API respondendo:**
   ```bash
   curl -I http://127.0.0.1:8080
   ```

3. **HTTPS funcionando:**
   ```bash
   curl -I https://evo.se7esistemassinop.com.br
   ```

4. **Certificados válidos:**
   ```bash
   sudo certbot certificates
   ```

## Migração para Novo Servidor

Para migrar para um novo servidor:

1. **Apontar DNS** para o novo servidor
2. **Instalar Docker** e Evolution API
3. **Executar script** de instalação do Nginx
4. **Restaurar dados** da Evolution API (diretório `instances`)

## Logs e Monitoramento

- **Logs Nginx:** `/var/log/nginx/evolution-api-*.log`
- **Logs Evolution API:** `docker logs evolution_api`
- **Status SSL:** `curl -I https://evo.se7esistemassinop.com.br`

## Suporte

- **Documentação oficial:** https://doc.evolution-api.com
- **GitHub:** https://github.com/EvolutionAPI/evolution-api

---

**Criado em:** $(date)  
**Para domínio:** evo.se7esistemassinop.com.br  
**Evolution API versão:** 2.3.1
