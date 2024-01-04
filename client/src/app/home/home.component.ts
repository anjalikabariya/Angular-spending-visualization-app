import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Color, ScaleType } from '@swimlane/ngx-charts';

interface ApiTransaction {
  totalAmount: number;
  startDate: string;
}

interface Data {
  name: string;
  value: number;
}

interface ChartData {
  name: string;
  series: Data[];
}

interface ApiResponse {
  spendings?: ApiTransaction[];
}

interface Currency {
  currency: string;
  default: boolean;
  symbol: string;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit {
  chartData: ChartData[] | null = null;
  colorScheme: Color = {
    name: 'myScheme',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: ['#5AA454', '#A10A28', '#C7B42C', '#AAAAAA'],
  };
  showXAxis = true;
  showYAxis = true;
  showLegend = true;
  showXAxisLabel = true;
  showYAxisLabel = true;
  xAxisLabel = 'Date';
  yAxisLabel = 'Total Amount';

  // Add new properties for the timeframe select field and range
  timeFrames: string[] = ['daily', 'monthly', 'yearly'];
  timeFrame: string = 'daily';
  rangeOptions: number[] = [1, 2, 3, 4, 5, 6];
  selectedRange: number = 6;
    
  // Add new properties for the currency select field and symbol
  currencies: Currency[] = [];
  selectedCurrency: string = 'CAD';
  currencySymbol: string = '$'; // Default currency symbol

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.getCurrencies();
    this.getTransactions();
  }

  // Add a method to fetch currencies from the server
  getCurrencies() {
    this.http.get('/api/currencies').subscribe(
      (data: any) => {
        // Check if the response is an array (Currency[])
        if (Array.isArray(data)) {
          this.currencies = data as Currency[];
          // Use the 'default' parameter to set the default currency
          const defaultCurrency = this.currencies.find((c) => c.default);
          if (defaultCurrency) {
            this.selectedCurrency = defaultCurrency.currency;
            this.currencySymbol = defaultCurrency.symbol;
          }
        } else {
          console.error('Invalid response format for currencies.');
        }
      },
      (error) => {
        console.error('Error fetching currencies:', error);
      }
    );
  }

  getTransactions() {
    this.http.get(`/api/spendings?frame=${this.timeFrame}&range=${this.selectedRange}&currency=${this.selectedCurrency}`)
      .subscribe((data: ApiResponse) => {
        const spendings = data.spendings || [];
        this.chartData = [
          {
            name: 'Spending',
            series: spendings.map((t: ApiTransaction) => ({
              value: t.totalAmount,
              name: new Date(t.startDate).toDateString(),
              formattedValue: this.formatCurrency(t.totalAmount),
            })),
          },
        ];
      });
  }

  onSelectionChange() {
    this.getTransactions();
  }

  yAxisTickFormatting(value: number) {
    return `${this.currencySymbol}${value.toFixed(2)}`;
  }
  // Helper method to format currency with symbol
  formatCurrency = (value: number) : string => {
    return `${this.currencySymbol}${value.toFixed(2)}`;
  }
  yaxisTickFormatting ( value: number) {
    const currencyFormat = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: this.selectedCurrency,
    });
    return currencyFormat.format(value);
  }
}
