import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { CategoryPage } from "./category";
import { SharedModule } from "../../app/shared.module";

@NgModule({
    declarations: [],
    imports: [
        IonicPageModule.forChild(CategoryPage),
        SharedModule
    ]
})
export class Module { }
