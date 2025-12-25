import React, { useState, useEffect } from "react";
import WelcomePage from "./WelcomePage";
import Tabs from "./Tabs";
import NewInterview from "../newinterview/NewInterview";
import InterviewHistory from "../history/InterviewHistory";
import TopicsService from "../newinterview/topicsService"; // Import the AI service

const InterviewSystem = () => {
  const [activeTab, setActiveTab] = useState("welcome");
  const [intervieweeDetails, setIntervieweeDetails] = useState({
    name: "",
    background: "",
    date: ""
  });
  const [selectedTopic, setSelectedTopic] = useState("");
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [customQuestions, setCustomQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [interviews, setInterviews] = useState([]);
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [summary, setSummary] = useState("");

  const handleQuestionSelect = (question) => {
    if (selectedQuestions.includes(question)) {
      setSelectedQuestions(selectedQuestions.filter((q) => q !== question));
      const newAnswers = { ...answers };
      delete newAnswers[question];
      setAnswers(newAnswers);
    } else {
      setSelectedQuestions([...selectedQuestions, question]);
    }
  };

  const handleAnswerChange = (question, answer) => {
    setAnswers({ ...answers, [question]: answer });
  };

  const handleCustomQuestionAdd = () => {
    const newQuestion = prompt("Enter your custom question:");
    if (newQuestion) {
      setCustomQuestions([...customQuestions, newQuestion]);
      setSelectedQuestions([...selectedQuestions, newQuestion]);
    }
  };

  const handleSaveInterview = () => {
    const newInterview = {
      id: Date.now(),
      interviewee: intervieweeDetails,
      topic: selectedTopic,
      questions: [...selectedQuestions, ...customQuestions],
      answers,
      customQuestions,
      date: new Date().toISOString()
    };
    setInterviews([...interviews, newInterview]);
    
    // Reset form
    setIntervieweeDetails({ name: "", background: "", date: "" });
    setSelectedTopic("");
    setSelectedQuestions([]);
    setCustomQuestions([]);
    setAnswers({});
    
    // Switch to history tab
    setActiveTab("history");
  };

  const handleGetSummary = async () => {
    if (!selectedInterview) return;

    // Here you could make an API call to generate a real summary
    setSummary(`Summary of interview with ${selectedInterview.interviewee.name} 
                about ${selectedInterview.topic} conducted on ${selectedInterview.date}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-indigo-200">
      <div className="container mx-auto p-4">
        <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />
        
        {activeTab === "welcome" && <WelcomePage />}
        
        {activeTab === "interview" && (
          <TopicsService>
            {({ topics, isLoading, error }) => {
              if (isLoading) {
                return (
                  <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
                  </div>
                );
              }

              if (error) {
                return (
                  <div className="text-center p-8 bg-white/50 backdrop-blur-sm rounded-lg">
                    <p className="text-red-600 font-medium">{error}</p>
                  </div>
                );
              }

              if (!topics) return null;

              return (
                <NewInterview
                  topics={topics}
                  intervieweeDetails={intervieweeDetails}
                  setIntervieweeDetails={setIntervieweeDetails}
                  selectedTopic={selectedTopic}
                  setSelectedTopic={setSelectedTopic}
                  selectedQuestions={selectedQuestions}
                  handleQuestionSelect={handleQuestionSelect}
                  answers={answers}
                  handleAnswerChange={handleAnswerChange}
                  handleCustomQuestionAdd={handleCustomQuestionAdd}
                  handleSaveInterview={handleSaveInterview}
                  customQuestions={customQuestions}
                />
              );
            }}
          </TopicsService>
        )}
        
        {activeTab === "history" && (
          <InterviewHistory
            interviews={interviews}
            selectedInterview={selectedInterview}
            setSelectedInterview={setSelectedInterview}
            handleGetSummary={handleGetSummary}
            summary={summary}
          />
        )}
      </div>
    </div>
  );
};

export default InterviewSystem;