import { Component } from '@angular/core';
import { NavParams, IonicPage } from 'ionic-angular';


@IonicPage({
    segment: 'home/:typehome'
})
@Component({
    selector: 'page-home',
    templateUrl: 'home.html'
})
export class HomePage {
    readonly root: any = 'ProgramPage';
    readonly count: number[];

    constructor(navParams: NavParams) {
        let number = navParams.get('days');

        this.count = Array(number);
        for (let i = 0; i < number; i++)
            this.count[i] = i;
    }

    onTabSelect(tab: { index: number; id: string; }) {
        console.log('Selected tab: ' + tab.index);
    }

}
