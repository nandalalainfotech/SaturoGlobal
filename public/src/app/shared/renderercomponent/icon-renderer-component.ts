import { Component, HostBinding } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { saveAs } from 'file-saver';

@Component({
    selector: 'app-icon-renderer',
    templateUrl: './icon-renderer-component.html',
    styleUrls: ['./icon-renderer-component.css']
})
export class IconRendererComponent implements ICellRendererAngularComp {

    params: any;
    label: string = "";
    toggle: boolean = false;
    public downloadUrl: string = `http://localhost:8000/uploads/xmlfiles/`;

    hexToRgb: any;
    rgbToHex: any;
    @HostBinding('style.--color_l1') colorthemes_1: any;
    @HostBinding('style.--color_l2') colorthemes_2: any;
    @HostBinding('style.--color_l3') colorthemes_3: any;
    @HostBinding('style.--color_l4') colorthemes_4: any;
    constructor() { }


    agInit(params: any): void {
     
        this.params = params;
        this.label = this.params.label;

        this.downloadUrl = this.downloadUrl + this.params.data.filename;
    }

    refresh(params?: any): boolean {
        return true;
    }

    onClick($event: any) {
        if (this.params.onClick instanceof Function) {
            const params = {
                event: $event,
                rowData: this.params.node.data
            }
            this.params.onClick(this.params);
        }
    }
    changeType(num: any) {
        this.toggle = !this.toggle;
    }
    
    download() {
        console.log("path", this.downloadUrl);
        saveAs( this.downloadUrl);
    }
}

