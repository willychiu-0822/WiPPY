// Side-effect module: wires Agent Hub modules together (job handlers, hooks,
// alert delivery, extra routes). Imported once by the app.
import { deliverAlertDirect } from './alertDelivery';
import { setAlertDeliverer } from './alerts';

setAlertDeliverer(deliverAlertDirect);

export {};
