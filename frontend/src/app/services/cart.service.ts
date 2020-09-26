import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {ProductService} from "./product.service";
import {OrderService} from "./order.service";
import {environment} from "../../environments/environment";
import {CartModelPublic, CartModelServer} from "../models/cart.model";
import {BehaviorSubject} from "rxjs";
import {ProductModelServer} from "../models/product.model";
import {NavigationExtras, Router} from "@angular/router";
import {NgxSpinnerService} from "ngx-spinner";
import {ToastrService} from "ngx-toastr";

@Injectable({
  providedIn: 'root'
})
export class CartService {

  private serverUrl = environment.SERVER_URL;

  //Sauvegarde des données de la commande du client sur le local storage

  private cartDataClient: CartModelPublic = {
      total: 0,
      prodData: [{
        incart: 0,
        id: 0
      }]
  };

  //Données variables sur le serveur
  private cartDataServer: CartModelServer = {
    total: 0,
    data: [{
      numIncart: 0,
      product: undefined
    }]
  };


  //Observables for the component to subscribe
  cartTotal$ = new BehaviorSubject<number>(0);
  cartData$ = new BehaviorSubject<CartModelServer>(this.cartDataServer);

  constructor(private http: HttpClient,
              private productService: ProductService,
              private orderService: OrderService,
              private router: Router,
              private spinner: NgxSpinnerService,
              private toast: ToastrService) {

      this.cartTotal$.next(this.cartDataServer.total);
      this.cartData$.next(this.cartDataServer);

      //Get the infos from local storage (if any)
      let info: CartModelPublic =  JSON.parse(localStorage.getItem('cart'));

      //Vérifier si info est vide ou pas
      if (info !== null && info !== undefined && info.prodData[0].incart !== 0){
        //localStorage n'est pas vide
        this.cartDataClient = info;

        //On parcours les données
        this.cartDataClient.prodData.forEach(p => {
          this.productService.getSingleProduct(p.id).subscribe((actualProductInfo: ProductModelServer) =>{
            if (this.cartDataServer.data[0].numIncart === 0){
              this.cartDataServer.data[0].numIncart = p.incart;
              this.cartDataServer.data[0].product = actualProductInfo;
              //Fonction total
              this.calculateTotal();
              this.cartDataClient.total = this.cartDataServer.total;
              localStorage.setItem('cart', JSON.stringify(this.cartDataClient));
            } else {
              this.cartDataServer.data.push({
                numIncart: p.incart,
                product: actualProductInfo
              });
              //Fonction total
              this.calculateTotal();
              this.cartDataClient.total = this.cartDataServer.total;
              localStorage.setItem('cart', JSON.stringify(this.cartDataClient));
            }
            this.cartData$.next({... this.cartDataServer});
          });
        });
      }

  }

  CalculateSubTotal(index): number {
    let subTotal = 0;

    let p = this.cartDataServer.data[index];
    // @ts-ignore
    subTotal = p.product.price * p.numInCart;

    return subTotal;
  }

  addProductToCart(id: number, quantity?: number){
    this.productService.getSingleProduct(id).subscribe(prod => {
      //Si le panier est vide
      if(this.cartDataServer.data[0].product === undefined){
        this.cartDataServer.data[0].product = prod;
        this.cartDataServer.data[0].numIncart = quantity !== undefined ? quantity : 1;
        this.calculateTotal();
        this.cartDataClient.prodData[0].incart = this.cartDataServer.data[0].numIncart;
        this.cartDataClient.prodData[0].id = prod.id;
        this.cartDataClient.total = this.cartDataServer.total;
        localStorage.setItem('cart', JSON.stringify(this.cartDataClient));
        this.cartData$.next({... this.cartDataServer});
        //Toast notification
        this.toast.success(`${prod.name} added to the cart`, 'Product added', {
          timeOut: 1500,
          progressBar: true,
          progressAnimation: "increasing",
          positionClass: 'toast-top-right'
        })

      } else {
          let index = this.cartDataServer.data.findIndex( p => p.product.id === prod.id);
          //si le produit existe => item positif
          if(index !== -1){
            if (quantity !== undefined && quantity <= prod.quantity){
              this.cartDataServer.data[index].numIncart = this.cartDataServer.data[index].numIncart <
              prod.quantity ? quantity : prod.quantity;
            } else {
              this.cartDataServer.data[index].numIncart = this.cartDataServer.data[index].numIncart <
              prod.quantity ? this.cartDataServer.data[index].numIncart++ : prod.quantity;
            }

            this.cartDataClient.prodData[index].incart = this.cartDataServer.data[index].numIncart;
            this.toast.info(`${prod.name} quantity updated in the cart`, 'Product updated', {
              timeOut: 1500,
              progressBar: true,
              progressAnimation: "increasing",
              positionClass: 'toast-top-right'
            })
          } else {
            // Si le produit n'est pas le panier
            this.cartDataServer.data.push({
              numIncart: 1,
              product: prod
            });

            this.cartDataClient.prodData.push({
              incart: 1,
              id: prod.id
            });
            this.calculateTotal();
            this.cartDataClient.total = this.cartDataServer.total;
            localStorage.setItem('cart', JSON.stringify(this.cartDataClient));
            this.cartData$.next({... this.cartDataServer});

            this.toast.success(`${prod.name} added to the cart`, 'Product added', {
              timeOut: 1500,
              progressBar: true,
              progressAnimation: "increasing",
              positionClass: 'toast-top-right'
            });

            // calcul du montant total
            this.calculateTotal();
            this.cartDataClient.total = this.cartDataServer.total;
            localStorage.setItem('cart', JSON.stringify(this.cartDataClient));
            this.cartData$.next({... this.cartDataServer});
          }
      }
    });

  } //end of function addProduct

  updateCartItems(index: number, increase: boolean){
    let data = this.cartDataServer.data[index];

    if (increase){
      data.numIncart < data.product.quantity ? data.numIncart++ : data.product.quantity;
      this.cartDataClient.prodData[index].incart = data.numIncart;
      // calcul du montant total
      this.calculateTotal();
      this.cartDataClient.total = this.cartDataServer.total;
      localStorage.setItem('cart', JSON.stringify(this.cartDataClient));
      this.cartData$.next({... this.cartDataServer});
    } else {
      data.numIncart --;

      if (data.numIncart < 1){
          this.deleteProductFromCart(index);
          this.cartData$.next({... this.cartDataServer});
      } else {
          this.cartData$.next({... this.cartDataServer});
          this.cartDataClient.prodData[index].incart = data.numIncart;
          // calcul du montant total
          this.calculateTotal();
          this.cartDataClient.total = this.cartDataServer.total;
          localStorage.setItem('cart', JSON.stringify(this.cartDataClient));
      }
    }
  }

  deleteProductFromCart(index: number){
    if (window.confirm('êtes-vous sûr de vouloir supprimer ?')){
        this.cartDataServer.data.splice(index, 1);
        this.cartDataClient.prodData.splice(index, 1);

        //calcul du montant total
        this.calculateTotal();
        this.cartDataClient.total = this.cartDataServer.total;

        if (this.cartDataClient.total === 0){
          this.cartDataClient = {total: 0, prodData: [{incart: 0, id: 0}]};
          localStorage.setItem('cart', JSON.stringify(this.cartDataClient));
        } else {
          localStorage.setItem('cart', JSON.stringify(this.cartDataClient));
        }

      if (this.cartDataServer.total === 0) {
        this.cartDataServer = {
          data: [{
            product: undefined,
            numIncart: 0
          }],
          total: 0
        };
        this.cartData$.next({...this.cartDataServer});
      } else {
        this.cartData$.next({...this.cartDataServer});
      }
    }
    // If the user doesn't want to delete the product, hits the CANCEL button
    else {
      return;
    }
  } //End of function

  private calculateTotal(){
    let Total = 0;

    this.cartDataServer.data.forEach(p =>{
      const {numIncart} = p;
      const {price} = p.product;

      Total += numIncart * price;
    });
    this.cartDataServer.total = Total;
    this.cartTotal$.next(this.cartDataServer.total);
  }

  checkoutFromCart(userId: number){
    this.http.post(`${this.serverUrl}orders/payment`, null).subscribe((res: { success: Boolean }) => {
      console.clear();

      if (res.success) {


        this.resetServerData();
        this.http.post(`${this.serverUrl}orders/new`, {
          userId: userId,
          products: this.cartDataClient.prodData
        }).subscribe((data: OrderConfirmationResponse) => {

          this.orderService.getSingleOrder(data.order_id).then(prods => {
            if (data.success) {
              const navigationExtras: NavigationExtras = {
                state: {
                  message: data.message,
                  products: prods,
                  orderId: data.order_id,
                  total: this.cartDataClient.total
                }
              };
              this.spinner.hide();
              this.router.navigate(['/thankyou'], navigationExtras).then(p => {
                this.cartDataClient = {prodData: [{incart: 0, id: 0}], total: 0};
                this.cartTotal$.next(0);
                localStorage.setItem('cart', JSON.stringify(this.cartDataClient));
              });
            }
          });

        })
      } else {
        this.spinner.hide();
        this.router.navigateByUrl('/checkout').then();
        this.toast.error(`Sorry, failed to book the order`, "Order Status", {
          timeOut: 1500,
          progressBar: true,
          progressAnimation: 'increasing',
          positionClass: 'toast-top-right'
        })
      }
    })
  }

  private resetServerData(){
    this.cartDataServer = {
      total: 0,
      data: [{
        numIncart: 0,
        product: undefined
      }]
    };

    this.cartData$.next({... this.cartDataServer})
  }

}

interface OrderConfirmationResponse {
  order_id: number;
  success: boolean;
  message: string;
  products: [{
    id: string,
    numInCart: string
  }]
}
