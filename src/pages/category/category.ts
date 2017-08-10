import { IonicPage } from 'ionic-angular';
import { NavParams } from 'ionic-angular';
import { Component } from '@angular/core';


@IonicPage({
    segment: 'home/:typecategory'
})
@Component({
    selector: 'page-category',
    templateUrl: 'category.html'
})
export class CategoryPage {

    private readonly categoryName: string
    private readonly tabNames: string[] = [];
    readonly root: any = 'TextComponent';

    constructor(navParams: NavParams) {
        // Get data!
        this.categoryName = navParams.get('categoryName');
        this.tabNames = navParams.get('tabNames');
    }

    onTabSelect(tab: { index: number; id: string; }) {
        console.log('Selected tab: ' + tab.index);
    }

}
