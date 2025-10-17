import { Component } from '@angular/core';
import { UploadService } from '../services/uploadService';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.html',
  styleUrls: ['./chat.css']
})
export class Chat {
  file: File | null = null;
  resposta = '';

  constructor(private uploadService: UploadService) { }

  onFileSelected(event: any) {
    this.file = event.target.files[0];
  }

  enviarArquivo() {
    if (!this.file) return;

    this.resposta = '⏳ Enviando arquivo...\n';

    this.uploadService.uploadFile(this.file).subscribe({
      next: (res: any) => {
        this.resposta = '✅ Arquivo enviado! Processamento concluído:\n\n';

        // Se res.result for objeto, formatamos de forma legível
        // if (res.result && typeof res.result === 'object') {
        //   for (const [key, value] of Object.entries(res.result)) {
        //     this.resposta += `${key}: ${JSON.stringify(value, null, 2)}\n`;
        //   }
        // } else {
        //   // Caso seja texto ou outro formato
        //   this.resposta += res.result;
        // }

        console.log('resposta: ', res)
      },
      error: (err) => {
        this.resposta = `❌ Erro: ${err.error?.error || err.message}`;
      }
    });
  }
}
