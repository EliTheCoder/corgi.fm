import * as firebase from 'firebase/app'
// tslint:disable-next-line:no-import-side-effect
import 'firebase/auth'
import React, {useContext} from 'react'
import {Store} from 'redux'
import {authActions, IClientAppState} from '@corgifm/common/redux'
import {getFirebaseConfig} from './firebase-config'

export const FirebaseContext = React.createContext<FirebaseContextStuff>({
	app: {} as any,
	auth: {} as any,
})

export type FirebaseContextStuff = ReturnType<typeof initializeFirebase>

export function initializeFirebase() {
	const app = firebase.initializeApp(getFirebaseConfig())

	const auth = firebase.auth(app)

	return {
		app,
		auth,
	}
}

export function wireUpFirebaseToRedux(firebaseContext: FirebaseContextStuff, store: Store<IClientAppState>) {
	firebaseContext.auth.onAuthStateChanged(async user => {
		if (user) {
			store.dispatch(authActions.logIn(user))
		} else {
			store.dispatch(authActions.logOut())
		}
	})
}

export function useFirebase() {
	return useContext(FirebaseContext)
}