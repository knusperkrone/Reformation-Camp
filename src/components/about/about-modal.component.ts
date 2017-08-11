import { Component } from '@angular/core';
import { ViewController } from 'ionic-angular';


@Component({
    selector: 'modal-about',
    templateUrl: 'about-modal.component.html'
})
export class AboutModal {

    constructor(private viewCtrl: ViewController) { }

    closeModal(): void {
        this.viewCtrl.dismiss();
    }

}
