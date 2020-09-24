import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {environment} from "../../environments/environment";
import {param} from "express-validator";


@Injectable({
  providedIn: 'root'
})
export class ProductService {

  private SERVER_URL = environment.SERVER_URL;
  constructor(private http: HttpClient) { }

  /*Récupèrer tous les produits*/

  getAllProducts(numberOfResults:number = 10){
    return this.http.get(this.SERVER_URL+ '/products');
  }
}
