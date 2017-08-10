import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { TextComponent } from './text';

@NgModule({
    declarations: [
        TextComponent
    ],
    imports: [
        IonicPageModule.forChild(TextComponent),
    ]
})
export class Module { }
