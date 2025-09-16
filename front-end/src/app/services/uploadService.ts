import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class UploadService {
    private apiUrl = 'http://localhost:3000';

    constructor(private http: HttpClient) { }

    uploadFile(file: File) {
        const formData = new FormData();
        formData.append('file', file);
        return this.http.post(`${this.apiUrl}/upload`, formData);
    }

    getResposta(callback: (text: string) => void) {
        const eventSource = new EventSource(`${this.apiUrl}/resposta`);
        eventSource.onmessage = (event) => callback(event.data);
        eventSource.onerror = () => eventSource.close();
    }
}
