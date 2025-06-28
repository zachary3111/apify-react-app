import React, { useState } from 'react';
import { Input } from "./components/ui/input"
import { Button } from "./components/ui/button"
import { Switch } from "./components/ui/switch"
import { Label } from "./components/ui/label"

export default function SearchForm() {
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [maxResults, setMaxResults] = useState(5);
  const [recentOnly, setRecentOnly] = useState(false);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    const response = await fetch('https://api.apify.com/v2/actor-tasks/Ew2lyICEnHMcqRo6T/runs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_API_TOKEN_HERE',
      },
      body: JSON.stringify({
        input: {
          query,
          location,
          startDate,
          endDate,
          maxResults,
          recentOnly,
        },
      }),
    });

    const runData = await response.json();

    let runStatus;
    while (true) {
      const res = await fetch(`https://api.apify.com/v2/actor-runs/${runData.data.id}`);
      const json = await res.json();
      runStatus = json.data.status;
      if (runStatus === 'SUCCEEDED') break;
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    const datasetRes = await fetch(`https://api.apify.com/v2/datasets/${runData.data.defaultDatasetId}/items?clean=true`);
    const datasetItems = await datasetRes.json();
    setResults(datasetItems);
    setLoading(false);
  };

  const handleExportCSV = () => {
    const headers = ['Title', 'URL', 'Date'];
    const rows = results.map(item => [item.title || 'N/A', item.url || 'N/A', item.date || 'N/A']);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "search_results.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyClipboard = () => {
    const text = results.map(item => `Title: ${item.title || 'N/A'}\nURL: ${item.url || 'N/A'}\nDate: ${item.date || 'N/A'}\n\n`).join('');
    navigator.clipboard.writeText(text).then(() => alert('Copied to clipboard!'));
  };

  return (
    <div className="bg-[#0e1117] p-8 max-w-md mx-auto rounded-xl text-white">
      <div className="space-y-4">
        <div>
          <Label>Search Query</Label>
          <Input placeholder="e.g. ai, machine learning" value={query} onChange={e => setQuery(e.target.value)} />
        </div>
        <div>
          <Label>Location UID (optional)</Label>
          <Input placeholder="Optional location UID" value={location} onChange={e => setLocation(e.target.value)} />
        </div>
        <div>
          <Label>Start Date (optional)</Label>
          <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
        </div>
        <div>
          <Label>End Date (optional)</Label>
          <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
        </div>
        <div>
          <Label>Max Results (optional)</Label>
          <Input type="number" value={maxResults} onChange={e => setMaxResults(e.target.value)} />
        </div>
        <div className="flex items-center space-x-2">
          <Switch checked={recentOnly} onCheckedChange={setRecentOnly} />
          <Label>Recent Posts Only (optional)</Label>
        </div>
        <Button className="w-full" onClick={handleSubmit} disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </Button>
      </div>

      {results.length > 0 && (
        <div className="mt-6 space-y-4">
          <h2 className="text-lg font-semibold">Search Results</h2>
          <div className="flex space-x-2">
            <Button onClick={handleExportCSV}>Export to CSV</Button>
            <Button onClick={handleCopyClipboard}>Copy to Clipboard</Button>
          </div>
          {results.map((item, idx) => (
            <div key={idx} className="p-4 bg-[#1a1f2b] rounded shadow">
              <p><strong>Title:</strong> {item.title || 'N/A'}</p>
              <p><strong>URL:</strong> <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">{item.url}</a></p>
              <p><strong>Date:</strong> {item.date || 'N/A'}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
