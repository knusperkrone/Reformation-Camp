import { APIContract } from './../../model/APIContract';
import { DatabaseService } from './../../providers/database.service';
import { Component, OnInit } from '@angular/core';
import { NavParams, IonicPage, NavController } from "ionic-angular";


import { NoteModal } from './../../components/note/note-modal.component';
import { JOINED_Termin, JOINED_Beschreibung } from './../../model/SQLContract';

@IonicPage()
@Component({
    selector: 'page-program',
    templateUrl: 'program.html',
})
export class ProgramPage {

    private readonly day: number = 0;
    private readonly rootNavCtrl: NavController;
    private readonly noteType: number = APIContract.DESRC_TYPE_ACCESS.NOTE;
    private terminList: JOINED_Termin[] = [];
    private init = false;

    constructor(navParams: NavParams, private dbService: DatabaseService) {
        this.rootNavCtrl = navParams.get('rootNavCtrl'); // To push over the tab, not inside
        this.day = navParams.get('day');

        this.terminList = this.dbService.getVeranstaltungen(this.day);
        this.dbService.getDatabaseState().subscribe(rdy => {
            if (rdy && this.init) {
                this.loadData(); // Refresh data after note got added
            }
            this.init = true;
        });
    }

    private loadData(): void {
        this.terminList = this.dbService.getVeranstaltungen(this.day);
    }

    private getMainClass(termin: JOINED_Termin): string {
        return (termin.details.length) ? 'childHolder' : 'noChildHolder';
    }

    private getDetailClass(detail: JOINED_Beschreibung): string {
        return (detail.BeschreibungTyp == APIContract.DESRC_TYPE_ACCESS.NOTE) ? '' : 'infoCard';
    }

    private toggleExpanded(termin: JOINED_Termin): void {
        if (termin.details.length != 0)
            termin.expanded = !termin.expanded;
    }

    private makeNote(termin: JOINED_Termin): void {
        this.rootNavCtrl.push(NoteModal, {
            'termin': true,
            'day': this.day,
            'parentTermin': termin
        });
    }

    private editNote(termin: JOINED_Termin, detail: JOINED_Beschreibung): void {
        this.rootNavCtrl.push(NoteModal, {
            'termin': false,
            'text': detail.Beschreibung,
            'day': this.day,
            'parentTermin': termin
        });
    }

    private prepareTime(time: string) {
        return time.substring(0, 5);
    }

    private prepareText(text: string) {
        return this.replaceAll(text, "\\n", "\n");
    }

    private replaceAll(str: string, find: string, replace: string): string {
        return str.split(find).join(replace);
    }

}
