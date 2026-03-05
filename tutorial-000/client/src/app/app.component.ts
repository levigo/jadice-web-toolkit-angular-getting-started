import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  standalone: false,
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
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
