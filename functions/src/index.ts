// Cloud Functions of the crew app (codebase "mobile" in firebase.json). They live with the app, but run
// on Firebase: the published app never calls them, Firestore triggers them on every write.
// Deploy only this codebase: `firebase deploy --only functions:mobile` (it never touches the web's functions).
import { initializeApp } from 'firebase-admin/app';

initializeApp();

export { notifyontaskwrite } from './taskTriggers';
