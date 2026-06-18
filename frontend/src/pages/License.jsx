import React from 'react';
import SEO from '../components/SEO';

export default function License() {
  return (
    <div className="max-w-[1000px] mx-auto px-6 py-12 text-slate-800 dark:text-slate-100">
      <SEO title="License | Arogya Raksha" />
      <h1 className="text-3xl font-black text-primary dark:text-secondary mb-6">License Agreement</h1>
      <div className="space-y-6 text-sm leading-relaxed">
        <section>
          <h2 className="text-xl font-bold mb-2">MIT License</h2>
          <p>Copyright (c) {new Date().getFullYear()} Devendra Sagar</p>
          <p className="mt-4">
            Permission is hereby granted, free of charge, to any person obtaining a copy
            of this software and associated documentation files (the "Software"), to deal
            in the Software without restriction, including without limitation the rights
            to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
            copies of the Software, and to permit persons to whom the Software is
            furnished to do so, subject to the following conditions:
          </p>
          <p className="mt-4">
            The above copyright notice and this permission notice shall be included in all
            copies or substantial portions of the Software.
          </p>
          <p className="mt-4 uppercase font-bold text-slate-500">
            THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
            IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
            FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
            AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
            LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
            OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
            SOFTWARE.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-2 mt-8">Third-Party Data</h2>
          <p>This software queries the OpenFDA API for pharmaceutical information. OpenFDA is a service of the U.S. Food and Drug Administration (FDA). The data from OpenFDA is for educational and informational purposes and does not constitute medical advice.</p>
        </section>
      </div>
    </div>
  );
}
