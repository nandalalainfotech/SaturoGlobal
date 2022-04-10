import { HttpClient, HttpEventType, HttpResponse } from '@angular/common/http';
import { Component, ElementRef, OnInit, VERSION, ViewChild, ViewContainerRef } from '@angular/core';

@Component({
	selector: 'app-saturoglobal',
	templateUrl: './saturoglobal.component.html',
	styleUrls: ['./saturoglobal.component.css']
})
export class saturoglobalComponent implements OnInit {

	percentDone?: number;
	uploadSuccess?: boolean;
	version = VERSION;
	selectedFile?: File | any = null;;

	@ViewChild('attachment') attachments!: ElementRef;

	constructor(private http: HttpClient, private elementRef: ElementRef) { }

	ngOnInit(): void {
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
