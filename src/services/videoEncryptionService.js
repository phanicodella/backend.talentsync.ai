// backend/src/services/videoEncryptionService.js
const crypto = require('crypto');
const { promisify } = require('util');

class VideoEncryptionService {
    constructor() {
        this.algorithm = 'aes-256-gcm';
        this.keyLength = 32; // 256 bits
        this.ivLength = 16; // 128 bits
        this.tagLength = 16; // 128 bits
    }

    async generateEncryptionKey() {
        const randomBytes = promisify(crypto.randomBytes);
        return await randomBytes(this.keyLength);
    }

    async encrypt(videoBuffer) {
        try {
            const key = await this.generateEncryptionKey();
            const iv = await promisify(crypto.randomBytes)(this.ivLength);
            const cipher = crypto.createCipheriv(this.algorithm, key, iv);
            
            const encryptedData = Buffer.concat([
                cipher.update(videoBuffer),
                cipher.final()
            ]);
            
            const tag = cipher.getAuthTag();

            return {
                encryptedData,
                key: key.toString('hex'),
                iv: iv.toString('hex'),
                tag: tag.toString('hex')
            };
        } catch (error) {
            console.error('Encryption error:', error);
            throw new Error('Video encryption failed');
        }
    }

    async decrypt(encryptedData, key, iv, tag) {
        try {
            const decipher = crypto.createDecipheriv(
                this.algorithm, 
                Buffer.from(key, 'hex'),
                Buffer.from(iv, 'hex')
            );
            
            decipher.setAuthTag(Buffer.from(tag, 'hex'));
            
            return Buffer.concat([
                decipher.update(encryptedData),
                decipher.final()
            ]);
        } catch (error) {
            console.error('Decryption error:', error);
            throw new Error('Video decryption failed');
        }
    }
}

module.exports = new VideoEncryptionService();
