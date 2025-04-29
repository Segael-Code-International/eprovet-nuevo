import { ChangeDetectionStrategy, Component, inject, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { ProductService } from '../../services/product.service';
import { Producto } from '../../interfaces/producto.interfaces';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { CurrencyPipe, isPlatformBrowser, SlicePipe, UpperCasePipe } from '@angular/common';
import { SkeletonModule } from 'primeng/skeleton';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [
    CardModule,
    ButtonModule,
    SkeletonModule,
    UpperCasePipe,
    SlicePipe,
    CurrencyPipe,
    ToastModule,
    RouterLink
  ],
  providers: [MessageService],
  templateUrl: './products.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ProductsComponent implements OnInit {
  private productService = inject(ProductService);
  private messageService = inject(MessageService);
   private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  id_marca = '671ac5cdc9c80b4d0388d787';

  // Usar señales para los estados
  productos = signal<Producto[]>([]);
  cargando = signal(true);
  placeholderItems = signal([1, 2, 3, 4, 5, 6]);
  pdfEnDescarga = signal<Record<string, boolean>>({});

  ngOnInit(): void {
    this.productService.obtener_productos(this.id_marca).subscribe({
      next: (res) => {
        this.productos.set(res.data);
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
      }
    });
  }

  descargarFichaTecnica(producto: Producto): void {
    // Comprobamos si estamos en el navegador
    if (!isPlatformBrowser(this.platformId)) {
      return; // No hacer nada en SSR
    }

    // Comprobar si el producto tiene URL de ficha técnica
    if (!producto.ficha_tecnica) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No hay ficha técnica disponible para este producto'
      });
      return;
    }

    // Actualizar estado de descarga
    const pdfEnDescargaActual = { ...this.pdfEnDescarga() };
    pdfEnDescargaActual[producto._id] = true;
    this.pdfEnDescarga.set(pdfEnDescargaActual);

    // Descargar el PDF utilizando Blob
    this.http.get(producto.ficha_tecnica, { responseType: 'blob' })
      .subscribe({
        next: (blob: Blob) => {
          // Crear URL para el blob
          const url = window.URL.createObjectURL(blob);

          // Crear un elemento <a> para la descarga
          const link = document.createElement('a');
          link.href = url;
          link.download = `Ficha-Tecnica-${producto.codigo}.pdf`;
          link.click();

          // Liberar el objeto URL
          window.URL.revokeObjectURL(url);

          // Actualizar estado de descarga
          const pdfEnDescargaActualizado = { ...this.pdfEnDescarga() };
          pdfEnDescargaActualizado[producto._id] = false;
          this.pdfEnDescarga.set(pdfEnDescargaActualizado);

          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Ficha técnica descargada correctamente'
          });
        },
        error: (error) => {
          console.error('Error al descargar PDF:', error);

          // Actualizar estado de descarga
          const pdfEnDescargaActualizado = { ...this.pdfEnDescarga() };
          pdfEnDescargaActualizado[producto._id] = false;
          this.pdfEnDescarga.set(pdfEnDescargaActualizado);

          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo descargar la ficha técnica'
          });
        }
      });
  }
}