import { map, switchMap, delay, catchError } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { Actions, ofType, createEffect } from '@ngrx/effects';
import { Observable, of, from } from 'rxjs';

import { User } from './user.model';

import { AngularFireAuth } from '@angular/fire/auth';
import * as firebase from 'firebase';

import * as userActions from './user.actions';
export type Action = userActions.ALL;

@Injectable()
export class UserEffects {
    getUser$ = createEffect(() =>
        this.actions.pipe(
            ofType(userActions.GET_USER),
            map((action: userActions.GetUser) => action.payload),
            switchMap(payload => this.afAuth.authState),
            map(authData => {
                if (authData) {
                    const user = new User(authData.uid, authData.displayName);
                    return new userActions.Authenticated(user);
                } else {
                    return new userActions.NotAuthenticated();
                }
            }),
            catchError(err => of(new userActions.AuthError({ error: err.message })))
        )
    );

    login$ = createEffect(() =>
        this.actions.pipe(
            ofType(userActions.GOOGLE_LOGIN),
            map((action: userActions.GoogleLogin) => action.payload),
            switchMap(payload => from(this.googleLogin())),
            map(credential => new userActions.GetUser()),
            catchError(err => of(new userActions.AuthError({ error: err.message})))
        )
    );

    logout$ = createEffect(() =>
        this.actions.pipe(
            ofType(userActions.LOGOUT),
            map((action: userActions.Logout) => action.payload),
            switchMap(payload => of(this.afAuth.auth.signOut())),
            map(authData => new userActions.NotAuthenticated()),
            catchError(err => of(new userActions.AuthError({ error: err.message})))
        )
    );

    constructor(private actions: Actions, private afAuth: AngularFireAuth) {}

    private googleLogin(): Promise<any> {
        const provider = new firebase.auth.GoogleAuthProvider;
        return this.afAuth.auth.signInWithPopup(provider);
    }
}