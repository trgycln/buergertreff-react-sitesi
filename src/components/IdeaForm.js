// src/components/IdeaForm.js
import React from "react";

const IdeaForm = ({ formspreeUrl }) => {
  return (
    <div className="bg-white p-8 rounded-lg shadow-lg border-t-4 border-rcRed max-w-2xl mx-auto">
      <h3 className="text-2xl font-bold text-gray-800 text-center">
        Teilen Sie Ihre Idee mit uns!
      </h3>
      <p className="text-gray-600 text-center mt-2 mb-6">
        Wir freuen uns auf Ihre Vorschläge.
      </p>
      <form action={formspreeUrl} method="POST" className="space-y-4">
        <input
          type="hidden"
          name="_next"
          value="https://buergertreffwissen.netlify.app/danke"
        />
        <input type="hidden" name="_language" value="de" />
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700"
          >
            Ihr Name
          </label>
          <input
            type="text"
            name="name"
            id="name"
            required
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-rcRed focus:border-rcRed"
          />
        </div>
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700"
          >
            Ihre E-Mail-Adresse
          </label>
          <input
            type="email"
            name="email"
            id="email"
            required
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-rcRed focus:border-rcRed"
          />
        </div>
        <div>
          <label
            htmlFor="idea"
            className="block text-sm font-medium text-gray-700"
          >
            Ihre Idee
          </label>
          <textarea
            name="idea"
            id="idea"
            rows="5"
            required
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-rcRed focus:border-rcRed"
          ></textarea>
        </div>
        <button
          type="submit"
          className="w-full bg-rcRed text-white font-bold py-3 px-6 rounded-md hover:bg-opacity-80 transition-colors"
        >
          Idee Senden
        </button>
      </form>
    </div>
  );
};

export default IdeaForm;
