import { Component, OnInit } from '@angular/core';

// @ts-ignore
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: false // for a proper fix, see https://v17.angular.io/guide/standalone-components
})


export class AppComponent implements OnInit{
  ngOnInit() {
    // do init at here for current route.
    console.log("hello world");
    setTimeout(() => {
      window.location.href = 'http://localhost:8080';
    }, 5000);  //5s
  }
}
