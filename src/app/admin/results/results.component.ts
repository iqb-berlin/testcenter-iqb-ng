import { Component, OnInit } from '@angular/core';

@Component({
  templateUrl: './results.component.html',
  styleUrls: ['./results.component.css']
})
export class ResultsComponent implements OnInit {

  constructor() { }

  ngOnInit() {
    this.clickButton(1);
  }

  clickButton(e) {
    console.log();
  }
}
