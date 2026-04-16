// Example: Get transcription, then process with OpenAI
export const transcribeAndAnalyze = async (audioFile) => {
  try {
    // Step 1: Transcribe audio
    const formData = new FormData();
    formData.append('audio', audioFile);

    const transcribeResponse = await fetch('http://localhost:3001/api/speech/transcribe', {
      method: 'POST',
      body: formData
    });

    const transcribeData = await transcribeResponse.json();

    if (!transcribeData.text) {
      throw new Error('Transcription failed');
    }

    console.log('✅ Transcription:', transcribeData.text);

    // Step 2: Process with OpenAI
    const analyzeResponse = await fetch('http://localhost:3001/api/summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transcript: transcribeData.text
      })
    });

    const analyzeData = await analyzeResponse.json();

    console.log('✅ Analysis:', analyzeData.result);

    return {
      transcription: transcribeData.text,
      analysis: analyzeData.result
    };

  } catch (error) {
    console.error('❌ Error:', error);
    return null;
  }
};

// Usage in your React component:
const handleAudioUpload = async (file) => {
  const result = await transcribeAndAnalyze(file);

  if (result) {
    setTranscription(result.transcription);
    setAnalysis(result.analysis); // OpenAI processed results
  }
};
