import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class BlockchainService {
  private readonly logger = new Logger(BlockchainService.name);
  private readonly blockchainUrl: string;

  constructor(private readonly configService: ConfigService) {
    // Default to localhost:3001 (Node 1) to avoid port conflicts with port 3000
    this.blockchainUrl = this.configService.get<string>(
      'BLOCKCHAIN_NODE_URL',
      'http://localhost:3001',
    );
  }

  /**
   * Submits a new system transaction to the blockchain.
   * Since it uses 'SYSTEM' sender, it bypasses cryptographic signature check.
   */
  async registrarTransaccion(recipient: string, data: any): Promise<boolean> {
    try {
      const payload = {
        sender: 'SYSTEM',
        recipient: recipient,
        data: data,
        signature: 'SYSTEM_AUDIT_LOG_SIGNATURE',
      };

      const response = await fetch(
        `${this.blockchainUrl}/api/blockchain/transaction`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        const errResult = await response.json();
        this.logger.error(
          `Error al enviar transaccion a blockchain: ${JSON.stringify(errResult)}`,
        );
        return false;
      }

      this.logger.log(
        `Transaccion enviada con exito al blockchain para el destinatario: ${recipient}`,
      );

      // Intentamos minar el bloque inmediatamente para que quede consolidada la auditoria
      await this.minarBloque();

      return true;
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `Fallo conexion con el nodo blockchain: ${err.message}`,
      );
      return false;
    }
  }

  /**
   * Triggers mining of pending transactions on the blockchain node.
   */
  private async minarBloque(): Promise<void> {
    try {
      const response = await fetch(
        `${this.blockchainUrl}/api/blockchain/mine`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rewardAddress: 'SYSTEM_AUDIT_MINER' }),
        },
      );

      if (!response.ok) {
        this.logger.warn(`No se pudo minar el bloque automaticamente.`);
      } else {
        const result = await response.json();
        this.logger.log(`Bloque minado en blockchain: ${result.block?.hash}`);
      }
    } catch (error) {
      const err = error as Error;
      this.logger.warn(
        `Fallo al intentar minar bloque en blockchain: ${err.message}`,
      );
    }
  }
}
