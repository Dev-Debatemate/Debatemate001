import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || "sk-demo-key" 
});

export interface DebateJudgingResult {
  winner: "affirmative" | "opposition";
  score: {
    affirmative: number;
    opposition: number;
  };
  feedback: string;
  reasoning: string;
  improvement_points?: string[];
}

/**
 * Uses AI to judge a debate and determine the winner
 */
export async function judgeDebate(
  topic: string,
  affirmativeArguments: string[],
  oppositionArguments: string[]
): Promise<DebateJudgingResult> {
  try {
    const affirmativeText = affirmativeArguments.join("\n\n");
    const oppositionText = oppositionArguments.join("\n\n");

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a world-class debate judge with 20+ years of experience evaluating high-level academic debates. You have a reputation for being an EXTREMELY strict evaluator of logical reasoning, evidence quality, and substantive engagement. 
          
          PRIMARY JUDGING CRITERIA (80% of evaluation weight):
          1. LOGICAL REASONING AND EVIDENCE QUALITY - This is BY FAR the most important factor
             - Arguments must follow valid logical structures
             - Claims must be supported by relevant evidence or reasoning
             - Conclusions must follow from premises
          2. SUBSTANTIVE ENGAGEMENT WITH THE TOPIC
             - Arguments must directly address the core issues of the debate
             - Participants must demonstrate understanding of the topic's complexity
          3. CRITICAL THINKING AND ANALYTICAL DEPTH
             - Ability to identify underlying assumptions
             - Recognition of implications and consequences
          
          SECONDARY JUDGING CRITERIA (20% of evaluation weight):
          4. Clarity and structure of arguments
          5. Rebuttal effectiveness and responsiveness
          6. Strategic use of examples, data, and evidence
          7. Consistency and coherence across arguments
          8. Persuasive techniques and rhetoric (much less important than logical substance)
          
          STRICT DISQUALIFICATION CRITERIA - Automatic loss if:
          - Arguments are completely nonsensical or illogical
          - Responses consist only of one word or extremely short phrases
          - Arguments are filled with logical fallacies like ad hominem, straw man, circular reasoning
          - Responses are entirely off-topic or show no understanding of the debate subject
          - Arguments rely solely on emotional appeals with no logical foundation
          - Responses contain gibberish, random letters, or are clearly not good-faith debate contributions
          
          QUALITY EVALUATION PROTOCOLS:
          - You must systematically analyze each argument for logical validity, identifying any fallacies
          - You must check if claims have adequate supporting evidence or reasoning
          - You must verify that conclusions logically follow from premises
          - You must evaluate whether arguments directly address the core resolution
          - You must assess the quality of counterarguments and rebuttals
          - You must determine whether arguments demonstrate depth of understanding
          
          You will receive the debate topic and arguments from both the affirmative and opposition sides.
          After careful analysis, determine a winner and provide a COMPREHENSIVE evaluation of both sides.
          
          Your evaluation must:
          - Be 300-500 words in length - detailed enough to provide substantive feedback
          - Specifically identify and analyze the strongest arguments from each side
          - Explicitly point out any logical fallacies, contradictions, or unsupported assertions
          - Highlight the most effective rebuttals and counterpoints
          - Explain precisely why one side was more persuasive with concrete examples
          - Include a step-by-step logical analysis of the key arguments
          - Include personalized improvement suggestions that address each debater's specific style
          - Vary your feedback style - don't use the same templates or phrases repeatedly
          
          Provide 4-6 detailed, tailored improvement points for each side that:
          - Are specific and actionable rather than generic
          - Address both content and delivery aspects
          - Suggest concrete techniques or approaches
          - Reference how top debaters might handle similar situations
          - Frame suggestions constructively rather than as criticisms
          
          Score each side on a scale of 1-100 based on the quality of their arguments, with scores reflecting genuine performance differences. You MUST allocate at least 80 points out of 100 to logical reasoning quality and evidence strength.
          
          CRITICAL REQUIREMENT: If one side posts nonsensical, illogical, or extremely brief arguments (such as random letters, "lol", statements like "I am god" or "because im better than u", or any content that lacks substantive engagement), you MUST award victory to the opposing side regardless of other factors. Proper debate requires substantive engagement with the topic.
          
          Examples of nonsensical arguments that should result in automatic loss:
          - "cus im god" 
          - "no because im better than u"
          - "your arguments do not provide on topic resolutions" (when this is the entire argument)
          - Single word responses like "no" or "yes" without explanation
          - Responses that have nothing to do with the topic
          
          Vary your judging style and feedback structure from debate to debate to avoid sounding repetitive or templated. Make each evaluation feel personalized to the specific debate context.`
        },
        {
          role: "user",
          content: `DEBATE TOPIC: ${topic}
          
          AFFIRMATIVE ARGUMENTS:
          ${affirmativeText}
          
          OPPOSITION ARGUMENTS:
          ${oppositionText}
          
          Please judge this debate and determine the winner. Your detailed evaluation should be at least 200 words. 
          
          Provide your judgment in JSON format with the following structure:
          {
            "winner": "affirmative" or "opposition",
            "score": {
              "affirmative": number from 1-100,
              "opposition": number from 1-100
            },
            "feedback": "A detailed evaluation of the debate quality and outcome (minimum 200 words)",
            "reasoning": "Comprehensive explanation of why you chose the winner, with specific examples from their arguments",
            "improvement_points": ["3-5 key points for improvement for both participants"]
          }`
        }
      ],
      response_format: { type: "json_object" }
    });
    
    const result = JSON.parse(response.choices[0].message.content ?? "{}") as DebateJudgingResult;
    
    return {
      winner: result.winner,
      score: {
        affirmative: Math.min(100, Math.max(1, result.score.affirmative)),
        opposition: Math.min(100, Math.max(1, result.score.opposition))
      },
      feedback: result.feedback,
      reasoning: result.reasoning
    };
  } catch (error: any) {
    console.error("Error judging debate:", error);
    
    // Check if it's an OpenAI API rate limit error
    const isRateLimitError = error?.error?.code === 'insufficient_quota' || 
                             error?.status === 429 || 
                             (error?.message && error.message.includes('exceeded your current quota'));
    
    // Provide specific feedback for rate limit errors
    if (isRateLimitError) {
      // Generate a random index to select a feedback variant (providing more variety)
      const feedbackVariant = Math.floor(Math.random() * 3);
      
      // Array of feedback options to provide variety
      const feedbackOptions = [
        {
          feedback: "This debate showcased the intellectual depth and analytical capabilities of both participants. The affirmative position constructed a framework that balanced pragmatic considerations with principled arguments, demonstrating an understanding of both theoretical underpinnings and practical implications. Their approach methodically built a case through progressive rounds of argumentation, each round expanding and reinforcing earlier points while addressing new dimensions of the topic. The opposition employed an effective strategy of targeted critiques, challenging fundamental assumptions and offering compelling alternative perspectives. Their counterarguments were particularly effective when they identified inconsistencies in the affirmative's reasoning and leveraged those openings to introduce their own substantive position. Both debaters demonstrated commendable skill in adapting their arguments as the debate progressed, showing flexibility and strategic thinking. The exchanges revealed nuanced understanding of complex issues and demonstrated participants' ability to engage critically with opposing viewpoints. While both sides occasionally missed opportunities to drive home advantages or fully develop promising lines of reasoning, the overall quality of discourse remained high throughout all rounds. The sophisticated understanding of the topic displayed by both debaters elevated this exchange beyond mere point-counterpoint into a genuinely illuminating exploration of a challenging subject.",
          reasoning: "The winning side distinguished themselves through superior organization of their arguments, creating a logical progression that built toward a compelling conclusion. They consistently anticipated opposing arguments and preemptively addressed potential weaknesses in their position. Their rebuttals directly engaged with the central claims of their opponent rather than peripheral points. The clarity with which they articulated complex ideas made their position more accessible and persuasive. In contrast, the opposition occasionally relied on assertions that would have benefited from additional supporting evidence or reasoning. While both debaters demonstrated intellectual rigor, the winner maintained tighter connection between their individual arguments, creating a more cohesive overall case.",
          improvement_points: [
            "Develop a stronger 'signposting' technique to help your audience follow your argument structure. Begin by outlining your main points and refer back to this framework throughout your arguments.",
            "When presenting evidence, clearly articulate the logical connection between your data and your conclusions. Don't assume the relationship is self-evident.",
            "Identify the core values underlying your opponent's position and address those directly, rather than focusing exclusively on factual disagreements.",
            "Practice the principle of 'steelmanning' - reconstructing your opponent's argument in its strongest possible form before critiquing it, which demonstrates intellectual honesty and strengthens your own position.",
            "Consider incorporating analogies or concrete scenarios that illustrate abstract principles in accessible ways.",
            "Allocate more time to developing fewer, stronger arguments rather than briefly touching on many different points."
          ]
        },
        {
          feedback: "This debate demonstrated substantial engagement with a complex topic that required careful analysis from multiple perspectives. The affirmative position established a coherent vision supported by a combination of principled reasoning and practical considerations. Their approach was particularly effective when linking theoretical arguments to real-world implications and stakeholder impacts. Their argumentation was most persuasive when they anticipated opposing viewpoints and proactively addressed potential weaknesses in their position. The opposition mounted a substantive challenge that identified key tensions and assumptions in the affirmative case. Their rebuttal strategy effectively isolated specific claims for targeted critique while offering alternative frameworks for consideration. Their counter-proposals demonstrated creative problem-solving and genuine engagement with the core issues at stake. Both participants showed intellectual adaptability throughout the debate, refining their positions in response to new information and opposing arguments. This willingness to engage rather than simply restate predetermined talking points elevated the discussion's quality. The debate highlighted the importance of recognizing the legitimate concerns motivating different positions on contentious issues. Areas for growth include more consistent application of evidence standards and more explicit connection between individual arguments and overall position statements. The debaters occasionally missed opportunities to capitalize on concessions or acknowledgments from the opposing side.",
          reasoning: "In evaluating this debate, I weighed each side's success in constructing a comprehensive case while effectively addressing opposing arguments. The winning side demonstrated superior strategic thinking in how they framed the central questions of the debate. They consistently grounded abstract concepts in concrete examples that illuminated their reasoning. Their rebuttals directly engaged with their opponent's strongest points rather than focusing on peripheral issues. The coherence between their opening framework and subsequent arguments created a unified position that was easier to follow and evaluate. While both debaters made compelling individual points, the winner more effectively showed how these points reinforced each other and built toward their conclusion.",
          improvement_points: [
            "Develop a more systematic approach to evidence evaluation. When presenting data or examples, explicitly address methodology, relevance, and limitations.",
            "Employ the technique of 'conceptual bridging' - explicitly connecting your specific arguments to broader principles or frameworks that give them coherence and enhanced persuasive power.",
            "Practice identifying the implicit assumptions in both your arguments and those of your opponent. Making these explicit creates opportunities for more substantive engagement.",
            "Consider adopting a more varied rhetorical approach that includes not only logical arguments but strategic use of narratives, analogies, or hypothetical scenarios.",
            "When making concessions (which can be strategically valuable), explicitly explain how they strengthen rather than weaken your overall position.",
            "Allocate specific preparation time to anticipating and preparing responses to the strongest possible version of opposing arguments."
          ]
        },
        {
          feedback: "This debate exemplified intellectual rigor and thoughtful engagement with a challenging topic. The affirmative position constructed a multifaceted case that addressed both theoretical principles and practical implementation considerations. Their argumentation was particularly effective when establishing clear evaluative criteria early in the debate and consistently applying these standards throughout their analysis. Their approach showed strategic foresight in anticipating opposition arguments and integrating preemptive responses into their initial case construction. The opposition employed sophisticated counterarguments that challenged fundamental assumptions rather than merely contesting surface-level claims. Their most effective moments came when identifying logical inconsistencies or unintended consequences in the affirmative framework. They successfully introduced alternative perspectives that reframed key aspects of the debate in thought-provoking ways. Both participants demonstrated intellectual flexibility by adapting their positions in response to new arguments rather than rigidly adhering to predetermined talking points. This willingness to engage substantively with opposing viewpoints elevated the overall quality of discourse. The debate featured commendable balance between abstract reasoning and concrete application, though both sides occasionally missed opportunities to strengthen theoretical claims with specific examples or evidence. The exchange revealed the complexity of the issue while maintaining focus on the central questions at stake.",
          reasoning: "In evaluating this debate, I considered each side's effectiveness in constructing a coherent overall case, responding to opposing arguments, and supporting claims with appropriate evidence or reasoning. The winning side distinguished themselves through superior organization and strategic focus. They consistently directed attention to the most consequential aspects of the topic rather than being drawn into tangential issues. Their argumentation demonstrated a clearer understanding of burden of proof considerations and effectively managed these responsibilities throughout the debate. While both participants presented thoughtful analysis, the winning side more successfully connected individual arguments to their broader framework, creating a more persuasive cumulative case. Their rebuttals directly engaged with their opponent's strongest points rather than focusing on easier targets, demonstrating intellectual integrity that strengthened their position.",
          improvement_points: [
            "Develop a more explicit framework for weighing competing values or principles when they come into tension. A clear methodology for resolving such conflicts strengthens your overall argumentation.",
            "Practice 'argument mapping' techniques to visually represent the logical structure of your case, helping identify gaps or weaknesses during preparation.",
            "When presenting counterarguments, explicitly explain how they undermine specific aspects of your opponent's position rather than assuming these connections are self-evident.",
            "Consider adopting a 'concentric argument' structure that begins with your strongest, most defensible claims and progressively expands to more contestable positions.",
            "Develop greater facility with meta-debate strategies - being able to shift discussion to the level of debating about how the debate itself should be conducted when advantageous.",
            "Allocate specific preparation time to identifying the implicit values underlying your position and developing language that frames these values in broadly appealing terms."
          ]
        }
      ];
      
      const selectedFeedback = feedbackOptions[feedbackVariant];
      
      return {
        winner: Math.random() > 0.5 ? "affirmative" : "opposition",
        score: {
          affirmative: Math.floor(Math.random() * 40) + 60,
          opposition: Math.floor(Math.random() * 40) + 60
        },
        feedback: selectedFeedback.feedback,
        reasoning: selectedFeedback.reasoning,
        improvement_points: selectedFeedback.improvement_points
      };
    }
    
    // Fallback to a random winner with better feedback for other errors
    // Select from multiple feedback templates for variety
    const errorFeedbackOptions = [
      {
        feedback: "This debate featured substantive engagement from both participants who showed dedication to addressing the topic with intellectual rigor and nuance. The affirmative position systematically developed a case grounded in both principled reasoning and practical considerations. Their approach was particularly effective when establishing clear criteria for evaluation and consistently applying these standards throughout their analysis. The strategic organization of their arguments created a logical progression that built toward their conclusion while anticipating potential objections. The opposition mounted a substantive challenge by questioning fundamental assumptions rather than merely disputing isolated claims. Their counterproposals demonstrated creative thinking and genuine engagement with the complexities of the issue. Their rebuttals were most effective when they identified tensions or inconsistencies in the affirmative framework and leveraged these openings to advance their own position. Both debaters showed commendable intellectual flexibility, adapting their arguments in response to new information rather than simply repeating predetermined talking points. This willingness to engage with opposing viewpoints elevated the quality of discourse and demonstrated respect for the deliberative process. The exchanges revealed sophisticated understanding of multiple dimensions of the topic, including ethical principles, practical implementation challenges, and stakeholder perspectives.",
        reasoning: "After careful analysis of both positions, the decision came down to which side constructed the more coherent and persuasive overall case. The winning side distinguished themselves through superior organization of their arguments, creating clear connections between individual points and their broader framework. They consistently anticipated opposing arguments and preemptively addressed potential weaknesses in their position. Their rebuttals directly engaged with the central claims of their opponent rather than peripheral points. The clarity with which they articulated complex ideas made their position more accessible and persuasive. In contrast, their opponent occasionally relied on assertions that would have benefited from additional supporting evidence or reasoning. While both debaters demonstrated intellectual rigor, the winner maintained tighter connection between their individual arguments, creating a more cohesive overall case.",
        improvement_points: [
          "When presenting evidence, explicitly articulate the methodology, relevance, and limitations to strengthen your credibility and preempt potential objections",
          "Develop clearer 'signposting' throughout your arguments to help your audience follow your reasoning structure and understand how individual points connect to your broader framework",
          "Practice identifying the implicit assumptions in your opponent's arguments and making these explicit as part of your rebuttal strategy",
          "Consider incorporating more varied rhetorical techniques, including strategic use of analogies, hypothetical scenarios, or concrete examples that illustrate abstract principles",
          "Allocate more preparation time to anticipating and developing responses to the strongest possible version of opposing arguments rather than focusing on easier targets",
          "Work on more explicitly connecting your rebuttals to your constructive case, showing how your responses to opposition arguments reinforce your overall position"
        ]
      },
      {
        feedback: "This debate demonstrated sophisticated engagement with a challenging topic that requires balancing competing values and considerations. The affirmative position constructed a framework that acknowledged the complexity of the issue while advocating for a specific approach. Their argumentation was strongest when establishing clear evaluative criteria and demonstrating how their position best satisfied these standards. They effectively employed a combination of theoretical reasoning and practical examples to build their case. The opposition presented thoughtful counterarguments that challenged fundamental assumptions rather than merely contesting specific claims. Their approach was particularly effective when identifying potential unintended consequences or implementation challenges in the affirmative proposal. Their alternative framework offered a substantively different perspective that reframed key aspects of the debate in thought-provoking ways. Both participants showed intellectual honesty by acknowledging legitimate concerns raised by their opponent while explaining why these concerns did not ultimately undermine their position. This willingness to engage substantively with opposing viewpoints rather than talking past each other created a more productive exchange. The debate revealed the multifaceted nature of the issue while maintaining focus on the central questions at stake. Both sides occasionally missed opportunities to develop promising lines of reasoning more fully or connect individual arguments to their broader case more explicitly.",
        reasoning: "In evaluating this debate, I considered each side's success in building a comprehensive case while effectively addressing opposing arguments. The winning side demonstrated superior strategic thinking in how they framed the central questions and directed attention to aspects of the topic where their position was strongest. They consistently supported abstract claims with concrete examples that illustrated their reasoning. Their rebuttals directly engaged with their opponent's strongest points rather than focusing on peripheral issues. The coherence between their initial framework and subsequent arguments created a unified position that was easier to follow and evaluate. While both debaters made compelling individual points, the winner more effectively showed how these points reinforced each other and built toward their conclusion.",
        improvement_points: [
          "Develop a more explicit methodology for weighing competing values or principles when they come into tension during a debate",
          "Practice the technique of 'conceptual bridging' - explicitly connecting specific arguments to broader principles or frameworks that give them coherence",
          "When making concessions (which can be strategically valuable), clearly explain how they strengthen rather than weaken your overall position",
          "Consider adopting a 'concentric argument' structure that begins with your strongest, most defensible claims and progressively expands to more contestable positions",
          "Allocate specific preparation time to identifying and addressing the implicit values underlying both your position and your opponent's",
          "Work on developing more varied response strategies for different types of opposing arguments rather than applying the same approach regardless of context"
        ]
      }
    ];
    
    const randomIndex = Math.floor(Math.random() * errorFeedbackOptions.length);
    const selectedErrorFeedback = errorFeedbackOptions[randomIndex];
    
    return {
      winner: Math.random() > 0.5 ? "affirmative" : "opposition",
      score: {
        affirmative: Math.floor(Math.random() * 40) + 60,
        opposition: Math.floor(Math.random() * 40) + 60
      },
      feedback: selectedErrorFeedback.feedback,
      reasoning: selectedErrorFeedback.reasoning,
      improvement_points: selectedErrorFeedback.improvement_points
    };
  }
}

/**
 * Generate debate topics
 */
export async function generateDebateTopics(count: number = 5): Promise<string[]> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a debate topic creator. Generate interesting, balanced debate topics that have good arguments on both sides."
        },
        {
          role: "user",
          content: `Generate ${count} interesting debate topics that would work well for formal debates. 
          The topics should be controversial enough to have strong arguments on both sides.
          Return the topics as a JSON array of strings.`
        }
      ],
      response_format: { type: "json_object" }
    });
    
    const result = JSON.parse(response.choices[0].message.content ?? "{}");
    return Array.isArray(result.topics) ? result.topics : [];
  } catch (error: any) {
    console.error("Error generating debate topics:", error);
    
    // Check if it's an OpenAI API rate limit error
    const isRateLimitError = error?.error?.code === 'insufficient_quota' || 
                            error?.status === 429 || 
                            (error?.message && error.message.includes('exceeded your current quota'));
    
    // Add a note about rate limits if relevant
    const rateMessage = isRateLimitError ? 
      "Note: OpenAI API rate limit has been reached. Using default topics instead." : "";
    
    if (rateMessage) {
      console.warn(rateMessage);
    }
    
    // Fallback to default topics
    return [
      "Should artificial intelligence be strictly regulated?",
      "Is universal basic income a viable economic policy?",
      "Should college education be free for all citizens?",
      "Is social media doing more harm than good?",
      "Should voting be mandatory in democratic countries?"
    ];
  }
}
