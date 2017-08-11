import { JOINED_TabContent } from './../../model/SQLContract';
import { IonicPage } from 'ionic-angular';
import { NavParams } from 'ionic-angular';
import { Component } from '@angular/core';
import { APIContract } from '../../model/APIContract'

import { DatabaseService } from './../../providers/database.service';

@IonicPage()
@Component({
    templateUrl: 'text.html'
})
export class TextComponent {

    readonly categoryName: string;
    readonly tabName: string;
    readonly title_TITLE = APIContract.TEXT_TITEL_TYPE.TITLE;
    readonly text_TEXT = APIContract.TEXT_CONTENT_TYPE.TEXT;
    readonly text_SUB_HEADING = APIContract.TEXT_CONTENT_TYPE.SUB_HEADING;

    tabContent: JOINED_TabContent[] = [];

    constructor(navParams: NavParams, private dbService: DatabaseService) {
        this.tabName = navParams.get('tabName');
        this.categoryName = navParams.get('categoryName');

        dbService.getDatabaseChanged().subscribe((rdy) => {
            this.loadData();
        });
    }

    private loadData(): void {
        this.dbService.getTabContent(this.categoryName, this.tabName).then((tabContent) => {
            this.tabContent = tabContent;
        });
    }

    private toggleExpanded(title: JOINED_TabContent): void {
        if (title.texts.length != 0)
            title.expandend = !title.expandend;
    }

    private prepareText(text: string): string {
        return this.replaceAll(text, "\\n", "\n");
    }

    private urlifyText(text: string): string {
        var urlRegex = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
        return text.replace(urlRegex, function (url) {
            return "<a href=\"" + url + "\">" + url + "</a>";
        })
    }

    private replaceAll(str: string, find: string, replace: string): string {
        return str.split(find).join(replace);
    }

}
