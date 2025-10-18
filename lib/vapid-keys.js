// Gerador de chaves VAPID para notificações push
import crypto from 'crypto';

// Função para gerar chaves VAPID
function generateVAPIDKeys() {
  const keyPair = crypto.generateKeyPairSync('ec', {
    namedCurve: 'prime256v1',
    publicKeyEncoding: {
      type: 'spki',
      format: 'der'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'der'
    }
  });

  const publicKey = Buffer.from(keyPair.publicKey).toString('base64url');
  const privateKey = Buffer.from(keyPair.privateKey).toString('base64url');

  return {
    publicKey,
    privateKey
  };
}

// Chaves VAPID válidas geradas pelo web-push
const VAPID_KEYS = {
  publicKey: process.env.VAPID_PUBLIC_KEY || 'BPnrmRaDCb62Qt1lkLzCxWARF2P11Usf-xgVuOsIxUXuNGNyjlMNlH6F4xy2izoqEAvGRLNS1eC6ql8pk0RaLgo',
  privateKey: process.env.VAPID_PRIVATE_KEY || 'IIk2C35BRCRKn_RrCs5o8UTEW3rN1HxcamqLqBaHyds',
  subject: process.env.VAPID_SUBJECT || 'mailto:admin@hospital-maintenance.com'
};

// Validar chaves VAPID
function validateVAPIDKeys() {
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    console.warn('⚠️  Chaves VAPID não configuradas. Usando chaves padrão...');
    console.log('🔑 Para produção, configure as variáveis de ambiente:');
    console.log('VAPID_PUBLIC_KEY=' + VAPID_KEYS.publicKey);
    console.log('VAPID_PRIVATE_KEY=' + VAPID_KEYS.privateKey);
  }
  
  return VAPID_KEYS;
}

export {
  generateVAPIDKeys,
  validateVAPIDKeys,
  VAPID_KEYS
};