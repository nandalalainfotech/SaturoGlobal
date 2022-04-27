import { HttpClient, HttpEventType, HttpResponse } from '@angular/common/http';
import { Component, ElementRef, OnInit, VERSION, ViewChild, ViewContainerRef } from '@angular/core';
import { GridOptions } from 'ag-grid-community';
import { Observable } from 'rxjs';
import { IconRendererComponent } from '../shared/renderercomponent/icon-renderer-component';


@Component({
	selector: 'app-saturoglobal',
	templateUrl: './saturoglobal.component.html',
	styleUrls: ['./saturoglobal.component.css']
})
export class saturoglobalComponent implements OnInit {

	percentDone?: number;
	uploadSuccess?: boolean;
	version = VERSION;
	selectedFile?: File | any = null;
	frameworkComponents: any;
	public gridOptions: GridOptions | any;

	@ViewChild('attachment') attachments!: ElementRef;

	constructor(private http: HttpClient, private elementRef: ElementRef) {
		// const rowData = this.getJSON().subscribe((data: string | any[]) => {
		//     if (data.length > 0) {
		//       this.gridOptions?.api?.setRowData(data);
		//     }
		//     else {
		//       this.gridOptions?.api?.setRowData([]);
		//     }
		//   });
		this.frameworkComponents = {
			iconRenderer: IconRendererComponent
		}

	}

	public getJSON(): Observable<any> {
		return this.http.get("./assets/saturoglobal.json");
	}

	ngOnInit(): void {

		this.createDataGrid001();


	}

	createDataGrid001(): void {
		this.gridOptions = {
			paginationPageSize: 10,
			rowSelection: 'single',
			// onFirstDataRendered: this.onFirstDataRendered.bind(this),
		};
		this.gridOptions.editType = 'fullRow';
		this.gridOptions.enableRangeSelection = true;
		this.gridOptions.animateRows = true;

		this.gridOptions.columnDefs = [
			{
				headerName: '#ID',
				field: 'Id',
				width: 200,
				flex: 1,
				sortable: true,
				filter: true,
				resizable: true,
				cellClass: "grid-cell-centered",
				headerCheckboxSelection: true,
				headerCheckboxSelectionFilteredOnly: true,
				checkboxSelection: true,
				suppressSizeToFit: true
			},

			{
				headerName: 'File Name',
				field: 'filename',
				width: 200,
				flex: 1,
				sortable: true,
				filter: true,
				resizable: true,
				cellClass: "grid-cell-centered",
				suppressSizeToFit: true
			},
			{
				headerName: 'File Size',
				field: 'filesize',
				width: 200,
				flex: 1,
				sortable: true,
				filter: true,
				resizable: true,
				cellClass: "grid-cell-centered",
				suppressSizeToFit: true
			},
			{
				headerName: 'Download Status',
				// headerComponentParams: { template: '<span><i class="fa fa-download"></i></span>' },
				field: 'downloadstatus',
				width: 200,
				flex: 1,
				sortable: true,
				filter: true,
				resizable: true,
				cellClass: "grid-cell-centered",

				suppressSizeToFit: true
			},
			{
				headerName: 'Date',
				// headerComponentParams: { template: '<span><i class="fa fa-eye" aria-hidden="true"></i></span>' },
				field: 'date',
				width: 200,
				flex: 1,
				sortable: true,
				filter: true,
				resizable: true,
				cellClass: "grid-cell-centered",
				suppressSizeToFit: true
			},
			{

				headerName: "",
				headerComponentParams: { template: '<span><i class="fa fa-download"></i></span>' },
				cellRenderer: 'iconRenderer',
				// cellRenderer: function () {
				// 	return '<span><i class="fa fa-download"></i></span>'
				// },
				flex: 1,
				width: 50,
				suppressSizeToFit: true,
				cellRendererParams: {
					label: 'File'

				},
			},
			// {
			// 	headerName: 'View',
			// 	// headerComponentParams: { template: '<span><i class="fa fa-eye" aria-hidden="true"></i></span>' },
			// 	cellRenderer: function () {
			// 		return '<span><i class="fa fa-eye" aria-hidden="true"></i></span>'
			// 	},
			// 	// field: 'view',
			// 	width: 200,
			// 	flex: 1,
			// 	sortable: true,
			// 	filter: true,
			// 	resizable: true,
			// 	cellClass: "grid-cell-centered",
			// 	suppressSizeToFit: true
			// },


		];

	}

	fileChange(event: any) {
		let fileList: FileList = event.target.files;
		if (fileList.length > 0) {
			this.selectedFile = fileList[0];
		}
	}

	fileUpload(event: any) {
		this.uploadAndProgressSingle();
	}

	upload(event: any) {
		this.uploadAndProgress(event.target.files);
	}

	changeXml(event: any) {

		this.http.post('http://localhost:8000/xml', { reportProgress: true, observe: 'events' }).subscribe(event => {


		});
	}

	basicUpload(files: File[]) {
		var formData = new FormData();
		Array.from(files).forEach(f => formData.append('file', f))
		this.http.post('https://file.io', formData).subscribe(event => {
			console.log(event);
		});
	}

	basicUploadSingle(file: File) {
		this.http.post('https://file.io', file).subscribe(event => {
			console.log('done')
		});
	}

	uploadAndProgress(files: File[]) {
		console.log(files)
		var formData = new FormData();
		Array.from(files).forEach(f => formData.append('file', f))
		this.http.post('http://localhost:8000/upload', formData, { reportProgress: true, observe: 'events' }).subscribe(event => {
			if (event.type === HttpEventType.UploadProgress) {
				this.percentDone = Math.round(100 * event.loaded / (event.total ? event.total : 1));
			} else if (event instanceof HttpResponse) {
				this.uploadSuccess = true;
			}
		});
	}

	uploadAndProgressSingle() {
		if (this.selectedFile) {
			let formDate = new FormData();
			formDate.append('file', this.selectedFile, this.selectedFile.name);
			this.http.post('http://localhost:8000/upload', formDate, { reportProgress: true, observe: 'events' }).subscribe(event => {

				if (event.type === HttpEventType.UploadProgress) {
					this.percentDone = Math.round(100 * event.loaded / (event.total ? event.total : 1));
				} else if (event instanceof HttpResponse) {
					console.log("event=============>", event);
					this.gridOptions?.api?.setRowData(event.body);
					this.uploadSuccess = true;
					this.selectedFile = null;
					this.attachments.nativeElement.value = null;
				}
			}, (error) => {
				console.log(error);
				// this.percentDone = 0;
				this.attachments.nativeElement.value = null;
				this.selectedFile = null;
				this.uploadSuccess = true;
			});
		}
	}

}
