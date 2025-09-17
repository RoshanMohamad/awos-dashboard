export interface ExportData {
  timestamp: string;
  temperature: number;
  humidity: number;
  pressure: number;
  windSpeed: number;
  windDirection: number;
  runway?: string;
  [key: string]: any;
}

export interface ReportMetadata {
  type: string;
  runway: string;
  dateFrom?: string;
  dateTo?: string;
  generated: string;
}

export class ExportUtils {
  /**
   * Generate CSV format export
   */
  static generateCSV(data: ExportData[], metadata: ReportMetadata): Blob {
    const headers = [
      'Timestamp',
      'Temperature (°C)',
      'Humidity (%)',
      'Pressure (hPa)',
      'Wind Speed (m/s)',
      'Wind Direction (°)'
    ];

    let csvContent = `Report Type,${metadata.type}\n`;
    csvContent += `Runway,${metadata.runway}\n`;
    csvContent += `Date Range,${metadata.dateFrom || ''} - ${metadata.dateTo || ''}\n`;
    csvContent += `Generated,${metadata.generated}\n\n`;
    
    csvContent += headers.join(',') + '\n';
    
    data.forEach(row => {
      csvContent += [
        row.timestamp,
        row.temperature.toFixed(1),
        row.humidity.toFixed(1),
        row.pressure.toFixed(1),
        row.windSpeed.toFixed(1),
        row.windDirection.toFixed(0)
      ].join(',') + '\n';
    });

    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  }

  /**
   * Generate Excel format export (using CSV with .xlsx extension and tab separation)
   */
  static generateExcel(data: ExportData[], metadata: ReportMetadata): Blob {
    const headers = [
      'Timestamp',
      'Temperature (°C)',
      'Humidity (%)',
      'Pressure (hPa)',
      'Wind Speed (m/s)',
      'Wind Direction (°)'
    ];

    let excelContent = `Report Type\t${metadata.type}\n`;
    excelContent += `Runway\t${metadata.runway}\n`;
    excelContent += `Date Range\t${metadata.dateFrom || ''} - ${metadata.dateTo || ''}\n`;
    excelContent += `Generated\t${metadata.generated}\n\n`;
    
    excelContent += headers.join('\t') + '\n';
    
    data.forEach(row => {
      excelContent += [
        row.timestamp,
        row.temperature.toFixed(1),
        row.humidity.toFixed(1),
        row.pressure.toFixed(1),
        row.windSpeed.toFixed(1),
        row.windDirection.toFixed(0)
      ].join('\t') + '\n';
    });

    return new Blob([excelContent], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
  }

  /**
   * Generate JSON format export
   */
  static generateJSON(data: ExportData[], metadata: ReportMetadata): Blob {
    const exportData = {
      metadata: {
        reportType: metadata.type,
        runway: metadata.runway,
        dateRange: {
          from: metadata.dateFrom,
          to: metadata.dateTo
        },
        generated: metadata.generated,
        totalRecords: data.length
      },
      data: data.map(row => ({
        timestamp: row.timestamp,
        measurements: {
          temperature: {
            value: Number(row.temperature.toFixed(1)),
            unit: '°C'
          },
          humidity: {
            value: Number(row.humidity.toFixed(1)),
            unit: '%'
          },
          pressure: {
            value: Number(row.pressure.toFixed(1)),
            unit: 'hPa'
          },
          windSpeed: {
            value: Number(row.windSpeed.toFixed(1)),
            unit: 'm/s'
          },
          windDirection: {
            value: Number(row.windDirection.toFixed(0)),
            unit: '°'
          }
        }
      }))
    };

    return new Blob([JSON.stringify(exportData, null, 2)], { 
      type: 'application/json;charset=utf-8;' 
    });
  }

  /**
   * Generate PDF format export (simplified HTML version)
   */
  static generatePDF(data: ExportData[], metadata: ReportMetadata): Blob {
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>AWOS Weather Report - ${metadata.type}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f0f9ff; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .metadata { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; }
        .metadata div { padding: 10px; background: #f9fafb; border-radius: 4px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; }
        th { background-color: #f3f4f6; font-weight: bold; }
        tr:nth-child(even) { background-color: #f9fafb; }
        .summary { margin-top: 20px; padding: 15px; background: #ecfdf5; border-radius: 8px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>AWOS Weather Data Report</h1>
        <p>Automated Weather Observation System</p>
    </div>
    
    <div class="metadata">
        <div><strong>Report Type:</strong> ${metadata.type}</div>
        <div><strong>Runway:</strong> ${metadata.runway}</div>
        <div><strong>Date Range:</strong> ${metadata.dateFrom || 'N/A'} - ${metadata.dateTo || 'N/A'}</div>
        <div><strong>Generated:</strong> ${new Date(metadata.generated).toLocaleString()}</div>
    </div>

    <table>
        <thead>
            <tr>
                <th>Timestamp</th>
                <th>Temperature (°C)</th>
                <th>Humidity (%)</th>
                <th>Pressure (hPa)</th>
                <th>Wind Speed (m/s)</th>
                <th>Wind Direction (°)</th>
            </tr>
        </thead>
        <tbody>
            ${data.map(row => `
                <tr>
                    <td>${new Date(row.timestamp).toLocaleString()}</td>
                    <td>${row.temperature.toFixed(1)}</td>
                    <td>${row.humidity.toFixed(1)}</td>
                    <td>${row.pressure.toFixed(1)}</td>
                    <td>${row.windSpeed.toFixed(1)}</td>
                    <td>${row.windDirection.toFixed(0)}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>

    <div class="summary">
        <h3>Report Summary</h3>
        <p><strong>Total Records:</strong> ${data.length}</p>
        <p><strong>Average Temperature:</strong> ${(data.reduce((sum, item) => sum + item.temperature, 0) / data.length).toFixed(1)}°C</p>
        <p><strong>Average Humidity:</strong> ${(data.reduce((sum, item) => sum + item.humidity, 0) / data.length).toFixed(1)}%</p>
        <p><strong>Average Pressure:</strong> ${(data.reduce((sum, item) => sum + item.pressure, 0) / data.length).toFixed(1)} hPa</p>
        <p><strong>Average Wind Speed:</strong> ${(data.reduce((sum, item) => sum + item.windSpeed, 0) / data.length).toFixed(1)} m/s</p>
    </div>
</body>
</html>`;

    return new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
  }

  /**
   * Get the appropriate file extension for the format
   */
  static getFileExtension(format: string): string {
    switch (format.toLowerCase()) {
      case 'csv': return '.csv';
      case 'excel': return '.xlsx';
      case 'pdf': return '.html'; // Note: This generates HTML that can be saved as PDF
      case 'json': return '.json';
      default: return '.txt';
    }
  }

  /**
   * Generate export based on format
   */
  static generateExport(data: ExportData[], metadata: ReportMetadata, format: string): Blob {
    switch (format.toLowerCase()) {
      case 'csv':
        return this.generateCSV(data, metadata);
      case 'excel':
        return this.generateExcel(data, metadata);
      case 'pdf':
        return this.generatePDF(data, metadata);
      case 'json':
        return this.generateJSON(data, metadata);
      default:
        return this.generateCSV(data, metadata); // Default to CSV
    }
  }

  /**
   * Download the generated file
   */
  static downloadFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }
}