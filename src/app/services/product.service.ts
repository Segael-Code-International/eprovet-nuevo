import { Injectable, inject, PLATFORM_ID, TransferState, makeStateKey } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, tap, catchError } from 'rxjs';
import { Producto, ProductoSlugResp } from '../interfaces/producto.interfaces';
import { environment } from '../../environments/environment';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { Categoria, CategoriaResp } from '../interfaces';

// Definimos claves para TransferState
const PRODUCTOS_KEY = makeStateKey<Record<string, Producto[]>>('productos');
const CATEGORIAS_KEY = makeStateKey<CategoriaResp>('categorias');

interface ProductosResponse {
  data: Producto[];
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private http = inject(HttpClient);
  private transferState = inject(TransferState);
  private platformId = inject(PLATFORM_ID);

  private apiUrl = environment.url;

  obtener_productos(id_marca: string): Observable<ProductosResponse> {
    // Intentar obtener datos del TransferState
    const stateProductos = this.transferState.get<Record<string, Producto[]>>(PRODUCTOS_KEY, {});

    // Si estamos en el navegador y los datos existen en TransferState, devolver esos datos
    if (isPlatformBrowser(this.platformId) && stateProductos[id_marca]) {
      return of({ data: stateProductos[id_marca] });
    }

    // Si los datos no existen o estamos en el servidor, hacer la petición HTTP
    return this.http.get<ProductosResponse>(`${this.apiUrl}eprovet/obtener-productos/${id_marca}`).pipe(
      tap(res => {
        // Si estamos en el servidor, almacena los datos en TransferState
        if (isPlatformServer(this.platformId)) {
          const currentState = this.transferState.get<Record<string, Producto[]>>(PRODUCTOS_KEY, {});
          const newState = { ...currentState, [id_marca]: res.data };
          this.transferState.set(PRODUCTOS_KEY, newState);
        }
      }),
      catchError(error => {
        console.error('Error obteniendo productos:', error);
        return of({ data: [] });
      })
    );
  }

  obtener_producto_por_slug(slug: string): Observable<ProductoSlugResp> {
    // Buscar primero en el TransferState
    const stateProductos = this.transferState.get<Record<string, Producto[]>>(PRODUCTOS_KEY, {});

    // Revisar si el producto está en alguna de las listas cacheadas
    for (const productos of Object.values(stateProductos)) {
      const producto = productos.find(p => p.slug === slug);
      if (producto) {
        // Devolvemos el producto en el formato ProductoSlugResp
        const response: ProductoSlugResp = {
          correcto: true,
          message: 'Producto encontrado en cache',
          data: producto
        };
        return of(response);
      }
    }

    // Si no lo encontramos, hacer la petición HTTP
    return this.http.get<ProductoSlugResp>(`${this.apiUrl}eprovet/obtener-producto-slug/${slug}`).pipe(
      tap(res => {
        // No guardamos productos individuales en el TransferState por ahora
      }),
      catchError(error => {
        console.error('Error obteniendo producto:', error);
        // Devolvemos un objeto con estructura correcta pero indicando el error
        return of({
          correcto: false,
          message: 'Error al obtener el producto',
          data: null as unknown as Producto // Forzamos el tipo para cumplir con la interfaz
        });
      })
    );
  }


  obtener_categorias(id_marca: string): Observable<CategoriaResp> {
    // Intentar obtener datos del TransferState
    const stateCategrias = this.transferState.get<CategoriaResp>(CATEGORIAS_KEY, { data: [] });

    // Si estamos en el navegador y los datos existen en TransferState, devolver esos datos
    if (isPlatformBrowser(this.platformId) && stateCategrias.data.length > 0) {
      return of(stateCategrias);
    }

    // Si los datos no existen o estamos en el servidor, hacer la petición HTTP
    return this.http.get<CategoriaResp>(`${this.apiUrl}eprovet/obtener-categorias/${id_marca}`).pipe(
      tap(res => {
        // Si estamos en el servidor, almacena los datos en TransferState
        if (isPlatformServer(this.platformId)) {
          this.transferState.set(CATEGORIAS_KEY, res);
        }
      }),
      catchError(error => {
        console.error('Error obteniendo categorías:', error);
        return of({ data: [] });
      })
    );
  }
}