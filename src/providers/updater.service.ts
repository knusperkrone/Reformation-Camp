import { DatabaseService } from './database.service';
import { NotificationService } from './notification.service';
import { Injectable } from '@angular/core';
import { Platform, ToastController } from "ionic-angular";

import { SQLite, SQLiteObject } from '@ionic-native/sqlite';
import { SQLitePorter } from '@ionic-native/sqlite-porter';
import { Storage } from '@ionic/storage';
import { File } from '@ionic-native/file';
import { Http } from '@angular/http';

import { BehaviorSubject } from 'rxjs/Rx';
import 'rxjs/add/operator/map';

import { APIContract } from "../model/APIContract";
import { SQL_Beschreibung, JOINED_Beschreibung, JOINED_TabContent, JOINED_Termin, ScheduleObject } from "../model/SQLContract";
import { SettingService } from './settings.service';

@Injectable()
export class UpdaterService {
    database: SQLiteObject;

    private readonly VERSION_URL = "https://raw.githubusercontent.com/knusperkrone/Reformation-Camp/master/src/assets/version.txt";
    private readonly DUMP_URL = "https://raw.githubusercontent.com/knusperkrone/Reformation-Camp/master/src/assets/backend.sql";
    private readonly updateFinished: BehaviorSubject<boolean> = new BehaviorSubject(false);


    constructor(private storage: Storage, private sqlite: SQLite, private http: Http, private file: File, private toastCtrl: ToastController,
        private settingService: SettingService, private notifications: NotificationService, platform: Platform) {
        platform.ready().then(() => {
            this.sqlite.create({
                // Open a database
                name: 'backend.db',
                location: 'default'
            }).then((db: SQLiteObject) => {
                // Check if database is already filled
                this.database = db;
                this.storage.get('database_filled').then(val => {
                    if (!val) {
                        // Initialize database
                        this.http.get('assets/backend.sql').subscribe(
                            (data) => {
                                this.fillDatabase(data.text(), []);
                                this.storage.set('database_filled', true);
                            },
                            (error) => {
                                console.log("[fillDatabase] Error" + JSON.stringify(error));
                                this.makeToast("Coundn't init database reinstall the app!")
                                console.log("update Finished[constructor]")
                                this.updateFinished.next(true);
                            });
                    } else {
                        this.checkUpdate();
                    }
                });
            });
        })
    }

    public isFinished() {
        return this.updateFinished.asObservable();
    }

    private fillDatabase(sql: string, notes: SQL_Beschreibung[]): void {
        // First write data, then, call restoreNotesFn(), then call finished()
        let restoreNotesFn = (): void => {
            console.log("Restoring notes");
            if (notes.length) {

                let restoreNotesCount = 0;
                // Call back when notes are inserted
                let restoreNotesCallback = (): void => {
                    if (++restoreNotesCount == notes.length)
                        finished();
                }

                for (let note of notes) {
                    this.addNote(note).then(
                        () => restoreNotesCallback(),
                        () => restoreNotesCallback()
                    ).catch(() => restoreNotesCallback());
                }
            } else {
                // We are already finished
                finished();
            }
        }

        let finished = (): void => {
            // Finally
            this.makeToast("Database updated")
            console.log("update Finished[finished]")
            this.updateFinished.next(true);
        }

        // Write statements in Datbase and then execute callback
        // Define callback to restore notes
        let statements: string[] = sql.split('\n');
        let restoreNotesCount = 0;
        let restoreNotesCallback = (): void => {
            console.log(restoreNotesCount + " == " + statements.length)
            if (++restoreNotesCount == statements.length - 1) {
                restoreNotesFn();
            }
        }


        for (let statement of statements) {
            if (statement.length != 0)
                this.database.executeSql(statement, []).then(
                    () => restoreNotesCallback(),
                    (error) => {
                        console.log("[fillDatabase] INSERT ERROR ON " + statement + ": " + JSON.stringify(error));
                        restoreNotesCallback()
                    }
                ).catch((error) => {
                    console.log("[fillDatabase catch] INSERT ERROR ON " + statement + "WITH: " + error);
                    restoreNotesCallback();
                });
        }
    }

    private checkUpdate(): void {
        this.storage.get("db_version").then((val) => {
            // Get current Version
            let currVersion = (val != null) ? val : 0;

            // Fetch online Version
            this.http.get(this.VERSION_URL)
                .subscribe((data) => {
                    // check if new Version is bigger than cached one and update, if nevessary
                    let newVersion = parseInt(data.text().trim());
                    if (newVersion > currVersion) {
                        this.makeToast("Updating database..")
                        this.updateDatabase();
                        this.storage.set("db_version", newVersion);
                    } else {
                        console.log("update Finished[No checkupdate]")
                        this.updateFinished.next(true);
                    }
                }
                , (error) => {
                    console.log("[checkUpdate] failed:" + error)
                    console.log("update Finished[CheckUpdate failed]")
                    this.updateFinished.next(true); // No Internet, so no update at all
                });
        });
    }

    private updateDatabase(): void {
        // Download new database
        this.http.get(this.DUMP_URL).subscribe((sqlDump) => {
            this.cacheNotes().then((notes) => {
                // Refill database && Restore notes
                this.refillDatabase(sqlDump.text(), notes);
            });
        }, (error) => {
            // Coulnd't get data
            console.log("[updateDatabase] error" + error);
            console.log("update Finished[updateDatabase]")
            this.updateFinished.next(true);
        });
    }

    private refillDatabase(sqlData: string, notes: SQL_Beschreibung[]): void {
        let wipe_query: string[] = [
            "DELETE FROM Kategorie; ",
            "DELETE FROM Instanz; ",
            "DELETE FROM Termin; ",
            "DELETE FROM Beschreibung; ",
            "DELETE FROM Kategorie; ",
            "DELETE FROM Kategorie_Tab; ",
            "DELETE FROM Kategorie_Tab_Titel; ",
            "DELETE FROM Kategorie_Tab_Text; ",
        ];

        // Delete all tables and replace files then
        let count = 0;
        for (let wipe of wipe_query) {
            this.database.executeSql(wipe, []).then((data) => {
                if (++count == wipe_query.length) {
                    this.fillDatabase(sqlData, notes)
                }
            }, (error) => {
                console.log("[wipDB] NOT WIPED DATABASE " + JSON.stringify(error));
                if (++count == wipe_query.length) {
                    this.fillDatabase(sqlData, notes)
                }
            });
        };

    }

    private cacheNotes(): Promise<SQL_Beschreibung[]> {
        let notes: SQL_Beschreibung[] = [];

        return this.database.executeSql("SELECT * FROM Beschreibung WHERE Typ == ?", [APIContract.DESRC_TYPE_ACCESS.NOTE]).then((data) => {
            for (let i = 0; i < data.rows.length; i++) {
                let cursor: SQL_Beschreibung = data.rows.item(i);
                notes.push(new SQL_Beschreibung(cursor.Id_Veranstaltung, cursor.Id_Instanz, cursor.Termin_Tag, cursor.Termin_Uhrzeit, cursor.Text, cursor.Typ));
            }
            return notes;
        }, (error) => {
            console.log("[cacheNotes] couldn't get data" + error);
            return notes;
        }).catch((error) => {
            "[cacheNotes] error" + error(); return notes;
        });
    }

    private addNote(note: SQL_Beschreibung): Promise<boolean> {
        return this.database.executeSql("INSERT INTO Beschreibung VALUES (?, ?, ?, ?, ?, ?)",
            [note.Id_Veranstaltung, note.Id_Instanz, note.Termin_Tag, note.Termin_Uhrzeit, note.Text, APIContract.DESRC_TYPE_ACCESS.NOTE]).then(
            (success) => true,
            (error) => {
                console.log("[addNote]Error inserting: ", error);
                return false;
            })
            .catch((error) => {
                console.log("[addNote Catch]Error inserting: ", error);
                return false;
            });
    }

    private makeToast(msg: string): void {
        this.toastCtrl.create({
            message: msg,
            duration: 3000,
            position: 'bottom'
        }).present();
    }

}
