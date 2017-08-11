import { APIContract } from './../../model/APIContract';
import { JOINED_Termin, JOINED_Beschreibung } from './../../model/SQLContract';
import { DatabaseService } from './../../providers/database.service';
import { NavController } from 'ionic-angular';
import { Component, OnInit, ViewChild } from '@angular/core';

import { NavParams, ToastController } from 'ionic-angular';

@Component({
    templateUrl: 'note-modal.component.html'
})
export class NoteModal implements OnInit {

    @ViewChild('myInput') myInput;
    private readonly noteType = APIContract.DESRC_TYPE_ACCESS.NOTE;
    private title: string = "Notiz bearbeiten"
    private text: string = "";
    private isNew: boolean;
    private day: number
    private parent: JOINED_Termin;
    private origText: string = "";


    constructor(private navCtrl: NavController, private toastCtrl: ToastController,
        private navParams: NavParams, private dbService: DatabaseService) { }

    ngOnInit(): void {
        this.isNew = this.navParams.get('termin');
        this.day = this.navParams.get('day');
        this.parent = this.navParams.get('parentTermin');

        if (this.isNew) {
            this.title = this.parent.Titel; // Set title
        } else {
            this.origText = this.navParams.get('text');
            this.text = this.origText; // Save origText
        }
    }

    private actionButton(button: string): void {
        switch (button) {
            case "cancel":
                this.navCtrl.pop(); // Close this
                break;

            case "delete":
                if (!this.isNew && !this.noteDelete()) { // New entry
                    this.makeToast("[FEHLER] Konnte den zu löschenden Eintrag nicht finden!");
                } else {
                    this.navCtrl.pop(); // Close this
                }
                break;

            case "save":
                if (this.isNew && !this.noteAdd()) { // Unsuccessful new entry
                    this.makeToast("[FEHLER] Ist der Eintrag leer, oder schon vorhanden?");
                } else if (!this.isNew && !this.noteUpdate()) { // Unsuccessful edited entry
                    this.makeToast("[FEHLER] Ist der neue Eintrag leer, oder schon vorhanden?");
                } else { // Something was succesfull
                    this.navCtrl.pop(); // Close this
                }
                break;
        }
    }

    private noteAdd(): boolean {
        let noteText = this.text.trim();
        if (noteText.length == 0) {
            return false;
        }

        if (this.dbService.addNote(noteText, this.day, this.parent.Uhrzeit)) {
            // Add at the right index
            this.parent.details.splice(this.getIndex(noteText), 0, new JOINED_Beschreibung(noteText, this.noteType));
            this.parent.expanded = true; // Always expand note then
            return true;
        }
        return false;
    }

    private noteUpdate(): boolean {
        let noteText = this.text.trim()
        if (noteText.length == 0) {
            return false;
        }

        if (this.dbService.updateNote(this.origText, noteText, this.parent.Titel, this.day, this.parent.Uhrzeit)) {
            // Remove and add at the right index
            this.parent.details.splice(this.getIndex(this.origText), 1);
            this.parent.details.splice(this.getIndex(noteText), 0, new JOINED_Beschreibung(noteText, this.noteType));
            return true;
        }
        return false;
    }

    private noteDelete(): boolean {
        if (this.dbService.deleteNote(this.origText, this.parent.Titel, this.day, this.parent.Uhrzeit)) {
            // Remove at the right index
            this.parent.details.splice(this.getIndex(this.origText), 1);
            return true;
        }
        return false;
    }

    private makeToast(msg: string) {
        this.toastCtrl.create({
            message: msg,
            duration: 3000,
            position: 'bottom'
        }).present();
    }

    private getIndex(text: string): number {
        let index = 0;
        for (let beschreibung of this.parent.details) {
            if (beschreibung.BeschreibungTyp != this.noteType || text.localeCompare(beschreibung.Beschreibung) <= 0)
                break;
            index++;
        }
        return index;
    }

    private resizeTextArea(): void {
        var element = this.myInput['_elementRef'].nativeElement.getElementsByClassName("text-input")[0];
        var scrollHeight = element.scrollHeight
        element.style.height = scrollHeight + 'px';
        this.myInput['_elementRef'].nativeElement.style.height = (scrollHeight + 16) + 'px';
    }

}

