const WebSocket = require('ws');

console.log('Testando conexão WebSocket...');

// Teste WebSocket local
const wsLocal = new WebSocket('ws://localhost:8080');

wsLocal.on('open', function open() {
    console.log('✅ WebSocket LOCAL conectado com sucesso!');
    wsLocal.close();
    
    // Teste WebSocket via domínio
    testDomainWebSocket();
});

wsLocal.on('error', function error(err) {
    console.log('❌ Erro WebSocket LOCAL:', err.message);
    testDomainWebSocket();
});

function testDomainWebSocket() {
    console.log('\nTestando WebSocket via domínio...');
    
    const wsDomain = new WebSocket('wss://dev-evo.se7esistemassinop.com.br');
    
    wsDomain.on('open', function open() {
        console.log('✅ WebSocket DOMÍNIO conectado com sucesso!');
        console.log('✅ Nginx está corretamente configurado para WebSocket!');
        wsDomain.close();
        process.exit(0);
    });
    
    wsDomain.on('error', function error(err) {
        console.log('❌ Erro WebSocket DOMÍNIO:', err.message);
        console.log('ℹ️  Verifique se a Evolution API suporta WebSocket na porta configurada');
        process.exit(1);
    });
    
    // Timeout de 5 segundos
    setTimeout(() => {
        console.log('⏱️  Timeout - Conexão WebSocket não estabelecida');
        process.exit(1);
    }, 5000);
}
