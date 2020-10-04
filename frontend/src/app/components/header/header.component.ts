import { Component, OnInit } from '@angular/core';
import {CartService} from "../../services/cart.service";
import {CartModelServer} from "../../models/cart.model";
import {UserService} from "../../services/user.service";

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {

  carData: CartModelServer;
  carTotal :number;
  authState: boolean;

  constructor(public cartService: CartService,
              private userService: UserService) { }

  ngOnInit(): void {
    this.cartService.cartTotal$.subscribe(total => this.carTotal = total);
    this.cartService.cartData$.subscribe(data => this.carData = data);
    this.userService.authState$.subscribe(authState =>this.authState = authState);
  }

}
