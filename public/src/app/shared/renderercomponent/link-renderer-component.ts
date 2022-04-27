import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';

@Component({
    selector: 'app-link-renderer',
    template: `<a href="javascript:void(0)" (click)="onClick($event)">{{label}}</a>`
})

export class LinkRendererComponent implements ICellRendererAngularComp {

    params: any;
    label: string = "";

    agInit(params: any): void {
        this.params = params;
        this.label = this.params.label || null;
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
}