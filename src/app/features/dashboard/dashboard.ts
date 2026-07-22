import { Component } from '@angular/core';
import { Calendar } from '../calendar/calendar';
import { Simulate } from '../simulate/simulate';
import { Summary } from '../summary/summary';
import { TripForm } from '../trips/trip-form';
import { TripList } from '../trips/trip-list';

@Component({
  selector: 'app-dashboard',
  imports: [Summary, TripForm, TripList, Calendar, Simulate],
  templateUrl: './dashboard.html',
})
export class Dashboard {}
