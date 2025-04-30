import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { Meta, Title } from '@angular/platform-browser';

@Component({
  selector: 'app-home',
  imports: [
    ButtonModule,
    RouterLink
  ],
  templateUrl: './home.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class HomeComponent implements OnInit {
  constructor(
    private meta: Meta,
    private title: Title
  ) {}

  ngOnInit(): void {
    // Configura el título de la página
    this.title.setTitle('EPROVET - Tecnología Agrícola y Ganadera de Vanguardia');
    
    // Configura las meta etiquetas para SEO
    this.meta.addTags([
      { name: 'description', content: 'EPROVET ofrece tecnología de vanguardia para optimizar operaciones agrícolas y ganaderas: picadoras, sistemas de ordeño y productos veterinarios de alta calidad.' },
      { name: 'keywords', content: 'tecnología agrícola, equipos ganaderos, picadoras, sistemas de ordeño, productos veterinarios, innovación agropecuaria, maquinaria agrícola' },
      { name: 'robots', content: 'index, follow' },
      { name: 'author', content: 'EPROVET' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { property: 'og:title', content: 'EPROVET - Tecnología Agrícola y Ganadera de Vanguardia' },
      { property: 'og:description', content: 'Transforma tu operación agrícola y ganadera con la vanguardia tecnológica de EPROVET.' },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: 'https://www.eprovet.com' }, // Ajusta esta URL a tu dominio real
      { property: 'og:image', content: 'https://www.eprovet.com/logo.jpeg' }, // Ajusta esta URL a tu imagen real
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: 'EPROVET - Tecnología Agrícola y Ganadera de Vanguardia' },
      { name: 'twitter:description', content: 'Transforma tu operación agrícola y ganadera con la vanguardia tecnológica de EPROVET.' },
      { name: 'twitter:image', content: 'https://www.eprovet.com/logo.jpeg' } // Ajusta esta URL a tu imagen real
    ]);
  }
}