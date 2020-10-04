import { Injectable } from '@angular/core';
import {GoogleLoginProvider, SocialAuthService, SocialUser} from "angularx-social-login";
import {HttpClient} from "@angular/common/http";
import {environment} from "../../environments/environment";
import {BehaviorSubject} from "rxjs";
import {body} from "express-validator";

@Injectable({
  providedIn: 'root'
})
export class UserService {

  auth: boolean = false;
  private SERVER_URL : string = environment.SERVER_URL;
  private user;
  authState$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(this.auth);
  userData$: BehaviorSubject<ResponseModel> = new BehaviorSubject<ResponseModel>(null);

  constructor(private authService: SocialAuthService,
              private http : HttpClient) {
    authService.authState.subscribe((user) =>{
        if (user !== null){
          this.auth = true;
          this.authState$.next(this.auth);
          // @ts-ignore
          this.userData$.next(user);
        }
    });
  }

  //Login user with email and password
  loginUser(email: string, password: string){
    this.http.post(`${this.SERVER_URL}/auth/login`, body(email, password))
      .subscribe((data:ResponseModel) =>{
        this.auth = data.auth;
        this.authState$.next(this.auth);
        this.userData$.next(data);
      })
  }

  //Google authentification
  googleLogin(){
    this.authService.signIn(GoogleLoginProvider.PROVIDER_ID);
  }

  //logout
  logout() {
    this.authService.signOut();
    this.auth = false;
    this.authState$.next(this.auth);
  }

}



 export interface ResponseModel {
    token: string;
    auth: boolean;
    email: string;
    username: string;
    fname: string;
    lname: string;
    photoUrl: string;
    userId: string;
   type: string;
   role: number;
}
