import { ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit, signal, PLATFORM_ID, Inject, computed, effect } from '@angular/core';
import { ProductService } from '../../services/product.service';
import { Producto } from '../../interfaces/producto.interfaces';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { CurrencyPipe, SlicePipe, UpperCasePipe, DOCUMENT, isPlatformBrowser } from '@angular/common';
import { SkeletonModule } from 'primeng/skeleton';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { FloatLabel } from 'primeng/floatlabel';
import { Meta, Title } from '@angular/platform-browser';
import { environment } from '../../../environments/environment';
import { Categoria } from '../../interfaces';
import { Tag } from 'primeng/tag';
import { CategoriaFilterService } from '../../services/categoria-filter.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SkeletonImageComponent } from "../../ui/skeletonImage/skeletonImage.component";
import { PaginationComponent } from '../../ui/pagination/pagination.component';
import { PaginatePipe } from '../../pipes/paginate.pipe';

@Component({
  selector: 'app-products',
  imports: [
    CardModule,
    ButtonModule,
    SkeletonModule,
    UpperCasePipe,
    SlicePipe,
    CurrencyPipe,
    ToastModule,
    RouterLink,
    FormsModule,
    InputTextModule,
    FloatLabel,
    Tag,
    SkeletonImageComponent,
    PaginationComponent,
    PaginatePipe
  ],
  providers: [MessageService],
  templateUrl: './products.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})

export default class ProductsComponent implements OnInit, OnDestroy {
  private productService = inject(ProductService);
  private messageService = inject(MessageService);
  private metaService = inject(Meta);
  private titleService = inject(Title);
  private document = inject(DOCUMENT);
  private categoriaFilterService = inject(CategoriaFilterService);
  private route = inject(ActivatedRoute);

  // Inject PLATFORM_ID to check if we're running in browser or server
  private platformId = inject(PLATFORM_ID);

  id_marca = environment.idMarca;

  // Usar señales para los estados
  productos = signal<Producto[]>([]);
  productosFiltrados = signal<Producto[]>([]);
  categorias = signal<Categoria[]>([]);
  cargando = signal(true);
  placeholderItems = signal([1, 2, 3, 4, 5, 6]);

  value: string = '';
  categorias_select = signal<string[]>([]);
  categoriasSeleccionadasCount = computed(() => this.categorias_select().length);

  currentPage = 1;
  pageSize = 6;

  constructor() {
    // Efecto para actualizar los productos filtrados cuando cambian las categorías seleccionadas
    effect(() => {
      this.filtrarProductos();
    });

    // Suscribirse a cambios en las categorías seleccionadas desde el servicio
    this.categoriaFilterService.categoriaSeleccionada$
      .pipe(takeUntilDestroyed())
      .subscribe(categorias => {
        if (categorias.length > 0) {
          this.categorias_select.set(categorias);
        }
      });
  }

  ngOnInit(): void {
    this.cargarProductos();

    this.route.queryParams.subscribe(params => {
      if (params['categoria']) {
        // Si hay un ID de categoría en la URL, establecerlo como seleccionado
        this.categoriaFilterService.setCategoria(params['categoria']);
        this.currentPage = 1;
      }
    });

    this.cargarCategorias();
    this.updateMetaTags();
  }

  get totalPages(): number {
    return Math.ceil(this.productosFiltrados().length / this.pageSize);
  }

  // Navigation
  onPageChange(page: number): void {
    window.scrollTo({ top: 10, behavior: 'smooth' });
    this.currentPage = page;
  }

  // Método para actualizar meta tags para un producto específico (para usar en página de detalle)
  updateProductMetaTags(producto: Producto): void {
    if (!producto) return;

    // Título específico del producto
    this.titleService.setTitle(`${producto.nombre} | Eprovet`);

    // Meta tags básicos
    this.metaService.updateTag({ name: 'description', content: producto.descripcion || `${producto.nombre} - Producto veterinario de alta calidad` });

    // URL canónica para evitar contenido duplicado - acceder a URL de forma segura
    const currentUrl = this.getAbsoluteUrl();
    this.metaService.updateTag({ rel: 'canonical', href: currentUrl });

    // Open Graph
    this.metaService.updateTag({ property: 'og:title', content: producto.nombre });
    this.metaService.updateTag({ property: 'og:description', content: producto.descripcion || `${producto.nombre} - Detalles del producto` });
    this.metaService.updateTag({ property: 'og:url', content: currentUrl });
    this.metaService.updateTag({ property: 'og:type', content: 'product' });
    this.metaService.updateTag({ property: 'og:site_name', content: 'Eprovet' });

    // Si hay imágenes disponibles, usar la primera para og:image
    if (producto.galeria && producto.galeria.length > 0) {
      this.metaService.updateTag({ property: 'og:image', content: producto.galeria[0] });
    }

    // Twitter Card
    this.metaService.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.metaService.updateTag({ name: 'twitter:title', content: producto.nombre });
    this.metaService.updateTag({ name: 'twitter:description', content: producto.descripcion || `${producto.nombre} - Producto veterinario` });

    // Keywords específicos del producto
    this.metaService.updateTag({
      name: 'keywords',
      content: `${producto.nombre}, ${producto.codigo}, productos veterinarios, ${producto.unidad_medida || ''}`
    });

    // Schema.org Product JSON-LD - Solo en el navegador
    if (isPlatformBrowser(this.platformId)) {
      this.addProductSchema(producto);
    }
  }

  private updateMetaTags(): void {
    // Título general de la página
    this.titleService.setTitle(`Eprovet | Catálogo de Productos`);

    // Obtenemos los nombres de los productos para keywords si hay productos cargados
    let productNames = '';
    const productosActuales = this.productos();
    if (productosActuales.length > 0) {
      // Extraer los primeros 5 nombres de productos para keywords
      productNames = productosActuales
        .slice(0, 5)
        .map(p => p.nombre)
        .join(', ');
    }

    // Meta tags para SEO
    this.metaService.updateTag({ name: 'description', content: 'Catálogo de productos veterinarios de alta calidad. Encuentra medicamentos, equipos y suministros para el cuidado animal.' });
    this.metaService.updateTag({ property: 'og:title', content: 'Eprovet | Productos Veterinarios' });
    this.metaService.updateTag({ property: 'og:description', content: 'Explora nuestra selección de productos veterinarios. Calidad y confianza para el cuidado de animales.' });

    // URL canónica para evitar contenido duplicado - acceder a URL de forma segura
    const currentUrl = this.getAbsoluteUrl();
    this.metaService.updateTag({ rel: 'canonical', href: currentUrl });
    this.metaService.updateTag({ property: 'og:url', content: currentUrl });

    // Si hay productos con imágenes, usar la primera imagen disponible para og:image
    if (productosActuales.length > 0 && productosActuales[0].galeria && productosActuales[0].galeria.length > 0) {
      this.metaService.updateTag({ property: 'og:image', content: productosActuales[0].galeria[0] });
    }

    // Metadatos adicionales
    this.metaService.updateTag({ property: 'og:type', content: 'website' });
    this.metaService.updateTag({ property: 'og:site_name', content: 'Eprovet' });
    this.metaService.updateTag({ name: 'keywords', content: `productos veterinarios, suministros veterinarios, ${productNames}` });
    this.metaService.updateTag({ name: 'robots', content: 'index, follow' });

    // Twitter Card
    this.metaService.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.metaService.updateTag({ name: 'twitter:title', content: 'Eprovet | Productos Veterinarios' });
    this.metaService.updateTag({ name: 'twitter:description', content: 'Explora nuestra amplia selección de productos veterinarios de calidad' });

    // Meta tags para móviles
    this.metaService.updateTag({ name: 'viewport', content: 'width=device-width, initial-scale=1' });

    // Agregamos también datos estructurados para la lista de productos (ItemList) - solo en navegador
    if (isPlatformBrowser(this.platformId)) {
      this.addProductListSchema();
    }
  }

  // Helper method to get the absolute URL safely (works in browser and server)
  private getAbsoluteUrl(): string {
    if (isPlatformBrowser(this.platformId)) {
      return window.location.href;
    } else {
      // For server rendering, provide a fallback URL or use request info if available
      // This is a simple fallback, you might want to inject a more sophisticated solution
      return 'https://eprovet.com/productos';
    }
  }

  // Helper method to get origin part of URL safely
  private getOrigin(): string {
    if (isPlatformBrowser(this.platformId)) {
      return window.location.origin;
    } else {
      // For server rendering, provide a fallback
      return 'https://eprovet.com';
    }
  }

  // Método para agregar datos estructurados para la lista de productos
  private addProductListSchema(): void {
    // Esta función solo debe ejecutarse en el navegador
    if (!isPlatformBrowser(this.platformId)) return;

    // Eliminar cualquier script ld+json existente para evitar duplicados
    this.removeExistingLdJson();

    const productosActuales = this.productosFiltrados();

    if (productosActuales.length === 0) return;

    // Crear un ItemList de productos para mejorar la visibilidad en búsquedas
    const itemListElements = productosActuales.map((producto, index) => {
      return {
        '@type': 'ListItem',
        'position': index + 1,
        'item': {
          '@type': 'Product',
          'name': producto.nombre,
          'description': producto.descripcion,
          'sku': producto.codigo,
          'image': producto.galeria && producto.galeria.length > 0 ? producto.galeria[0] : undefined,
          'url': `${this.getOrigin()}/product/${producto.slug || producto._id}`
        }
      };
    });

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      'itemListElement': itemListElements
    };

    // Crear un elemento script con el JSON-LD
    const script = this.document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(schema);

    // Agregar el script al head del documento
    this.document.head.appendChild(script);
  }

  cargarProductos(): void {
    this.productService.obtener_productos(this.id_marca).subscribe({
      next: (res) => {
        this.productos.set(res.data);
        this.productosFiltrados.set(res.data);
        this.cargando.set(false);
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los productos'
        });
        this.cargando.set(false);
      }
    });
  }

  esCategoriaSeleccionada(id_categoria: string): boolean {
    return this.categorias_select().includes(id_categoria);
  }

  cargarCategorias(): void {
    this.productService.obtener_categorias(this.id_marca).subscribe({
      next: (res) => {
        this.categorias.set(res.data);
      },
      error: (err) => {
        this.categorias.set([]);
      }
    });
  }

  seleccionarCategoria(id_categoria: string): void {
    // Obtener array actual de categorías seleccionadas
    this.currentPage = 1;
    const categoriasActuales = [...this.categorias_select()];

    // Verificar si la categoría ya está seleccionada
    const indice = categoriasActuales.indexOf(id_categoria);

    if (indice >= 0) {
      // Si ya está seleccionada, la quitamos
      categoriasActuales.splice(indice, 1);
    } else {
      // Si no está seleccionada, la agregamos
      categoriasActuales.push(id_categoria);
    }

    // Actualizar la señal de categorías seleccionadas
    this.categorias_select.set(categoriasActuales);
    this.categoriaFilterService.setCategorias(categoriasActuales);

    // Filtrar productos
    this.filtrarProductos();
  }

  seleccionarTodas(): void {
    // Limpiar categorías seleccionadas
    this.currentPage = 1;
    this.categorias_select.set([]);

    // Mostrar todos los productos
    this.productosFiltrados.set(this.productos());
    this.categoriaFilterService.clearCategorias();
  }

  filtrarProductos(): void {
    const categoriasSeleccionadas = this.categorias_select();

    // Si no hay categorías seleccionadas, mostrar todos los productos
    if (categoriasSeleccionadas.length === 0) {
      this.productosFiltrados.set(this.productos());
      return;
    }

    // Filtrar productos por categorías seleccionadas
    const productosFiltrados = this.productos().filter(producto =>
      categoriasSeleccionadas.includes(producto.id_categoria)
    );

    // Actualizar la señal de productos filtrados
    this.productosFiltrados.set(productosFiltrados);
  }

  buscarProducto(): void {
    if (!this.value || this.value.trim() === '') {
      // Si no hay texto de búsqueda, mostrar todos los productos
      this.productosFiltrados.set(this.productos());
      return;
    }

    const busqueda = this.value.toLowerCase().trim();

    // Filtrar productos que coincidan por código o nombre
    const filtrados = this.productos().filter(producto =>
      producto.codigo.toLowerCase().includes(busqueda) ||
      producto.nombre.toLowerCase().includes(busqueda)
    );

    this.productosFiltrados.set(filtrados);

    // Opcional: Mostrar mensaje si no hay resultados
    if (filtrados.length === 0 && !this.cargando()) {
      this.messageService.add({
        severity: 'info',
        summary: 'Búsqueda',
        detail: 'No se encontraron productos para tu búsqueda'
      });
    }
  }

  // Método para agregar datos estructurados Schema.org para productos
  private addProductSchema(producto: Producto): void {
    // Esta función solo debe ejecutarse en el navegador
    if (!isPlatformBrowser(this.platformId)) return;

    // Eliminar cualquier script ld+json existente para evitar duplicados
    this.removeExistingLdJson();

    // Crear el esquema de datos estructurados para el producto
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: producto.nombre,
      description: producto.descripcion,
      sku: producto.codigo,
      mpn: producto.codigo,
      brand: {
        '@type': 'Brand',
        name: 'Eprovet'
      },
      offers: {
        '@type': 'Offer',
        price: producto.precio,
        priceCurrency: 'USD',
        availability: producto.estado === 1 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        url: this.getAbsoluteUrl()
      },
      image: [''],
    };

    // Si hay imágenes disponibles, agregarlas al esquema
    if (producto.galeria && producto.galeria.length > 0) {
      schema['image'] = producto.galeria;
    }

    // Crear un elemento script con el JSON-LD
    const script = this.document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(schema);

    // Agregar el script al head del documento
    this.document.head.appendChild(script);
  }

  // Método para eliminar cualquier script ld+json existente
  private removeExistingLdJson(): void {
    // Esta función solo debe ejecutarse en el navegador
    if (!isPlatformBrowser(this.platformId)) return;

    const existingScripts = this.document.querySelectorAll('script[type="application/ld+json"]');
    existingScripts.forEach(script => script.remove());
  }

  // Método para manejar cambios en el input (puedes usar este en lugar de ngModelChange)
  onInputChange(): void {
    this.buscarProducto();
  }

  ngOnDestroy(): void {
    // Limpiar los scripts de ld+json cuando el componente se destruye - solo en navegador
    if (isPlatformBrowser(this.platformId)) {
      this.removeExistingLdJson();
    }
  }
}