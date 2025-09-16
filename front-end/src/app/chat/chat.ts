import { Component } from '@angular/core';
import { UploadService } from '../services/uploadService';

@Component({
  selector: 'app-chat',
  imports: [],
  templateUrl: './chat.html',
  styleUrl: './chat.css'
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
    this.uploadService.uploadFile(this.file).subscribe(() => {
      this.uploadService.getResposta((text) => {
        this.resposta += text;
      });
    });
  }
}
