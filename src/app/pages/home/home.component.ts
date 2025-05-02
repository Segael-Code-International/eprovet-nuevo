import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { Chip } from 'primeng/chip';
import { Meta, Title } from '@angular/platform-browser';
import { Categoria } from '../../interfaces/categoria.interface';
import { ProductService } from '../../services/product.service';
import { environment } from '../../../environments/environment';
import { CategoriaFilterService } from '../../services/categoria-filter.service';

@Component({
  selector: 'app-home',
  imports: [
    ButtonModule,
    RouterLink,
    Chip
  ],
  templateUrl: './home.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class HomeComponent implements OnInit {

  private productService = inject(ProductService);
  private categoriaFilterService = inject(CategoriaFilterService);
  private router = inject(Router);
  
  categorias = signal<Categoria[]>([]);
  cargando = signal(false);
  id_marca = environment.idMarca;

  constructor(
    private meta: Meta,
    private title: Title
  ) { }

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
      { property: 'og:url', content: 'https://www.eprovet.com' },
      { property: 'og:image', content: 'https://www.eprovet.com/logo.jpeg' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: 'EPROVET - Tecnología Agrícola y Ganadera de Vanguardia' },
      { name: 'twitter:description', content: 'Transforma tu operación agrícola y ganadera con la vanguardia tecnológica de EPROVET.' },
      { name: 'twitter:image', content: 'https://www.eprovet.com/logo.jpeg' }
    ]);

    this.cargarCategorias();
  }

  cargarCategorias(): void {
    this.cargando.set(true);
    this.productService.obtener_categorias(this.id_marca).subscribe({
      next: (res) => {
        this.categorias.set(res.data);
        this.cargando.set(false);
      },
      error: (err) => {
        this.categorias.set([]);
        this.cargando.set(false);
      }
    });
  }

  selectCategoria(id_categoria: string): void {
    // Establecer la categoría seleccionada en el servicio compartido
    this.categoriaFilterService.setCategoria(id_categoria);
    
    // Navegar a la página de productos
    this.router.navigate(['/products'], {
      queryParams: { categoria: id_categoria }
    });
  }
}