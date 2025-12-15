"""
CrewAI Content Generation Crew
Core #2 - Generates marketing content, copy, and creative assets
"""

from crewai import Agent, Crew, Task, Process
from crewai.project import CrewBase, agent, crew, task
from typing import List, Dict, Any
from pydantic import BaseModel
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
from shared.config import Config, CoreType


# =============================================================================
# OUTPUT SCHEMAS
# =============================================================================

class AdCopy(BaseModel):
    """Schema for ad copy output"""
    headline: str
    body: str
    call_to_action: str
    platform: str
    character_count: int


class EmailSequence(BaseModel):
    """Schema for email sequence"""
    subject_line: str
    preview_text: str
    body_html: str
    send_delay_days: int


class ContentGenerationOutput(BaseModel):
    """Schema for complete content generation output"""
    ad_copies: List[AdCopy]
    email_sequence: List[EmailSequence]
    landing_page_copy: Dict[str, str]
    social_media_posts: List[Dict[str, str]]
    video_script: str


# =============================================================================
# CREW DEFINITION
# =============================================================================

@CrewBase
class ContentGenerationCrew:
    """
    Content Generation Crew - Creates marketing content and creative assets
    
    This crew consists of four specialized agents:
    1. Copywriter - Creates compelling ad copy and sales text
    2. Email Specialist - Designs email sequences and campaigns
    3. Social Media Expert - Creates platform-specific social content
    4. Video Scripter - Writes video scripts and hooks
    """
    
    def __init__(self):
        pass
    
    # =========================================================================
    # AGENTS
    # =========================================================================
    
    @agent
    def copywriter(self) -> Agent:
        """Agent that creates compelling ad copy"""
        return Agent(
            role="Senior Direct Response Copywriter",
            goal="Create high-converting ad copy and sales text that drives clicks and conversions",
            backstory="""You are a world-class direct response copywriter trained by legends like 
            Gary Halbert, Eugene Schwartz, and David Ogilvy. You've written copy that has generated 
            over $100M in sales. You understand the psychology of persuasion and know how to craft 
            headlines that stop scrollers, body copy that builds desire, and CTAs that compel action.
            Your specialty is affiliate marketing copy that converts cold traffic into buyers.""",
            verbose=Config.CREWAI_VERBOSE,
            allow_delegation=True
        )
    
    @agent
    def email_specialist(self) -> Agent:
        """Agent that designs email sequences"""
        return Agent(
            role="Email Marketing Strategist",
            goal="Design email sequences that nurture leads and drive affiliate sales",
            backstory="""You are an email marketing expert who has managed lists of 1M+ subscribers.
            You understand email deliverability, open rate optimization, and the art of the follow-up.
            Your sequences have achieved 40%+ open rates and 15%+ click rates consistently.
            You know how to build trust, create urgency, and time your sends for maximum impact.""",
            verbose=Config.CREWAI_VERBOSE,
            allow_delegation=False
        )
    
    @agent
    def social_media_expert(self) -> Agent:
        """Agent that creates social media content"""
        return Agent(
            role="Social Media Content Creator",
            goal="Create viral-worthy social media content optimized for each platform",
            backstory="""You are a social media native who understands the nuances of every platform.
            You know that what works on TikTok won't work on LinkedIn. You've grown accounts from 
            0 to 100K+ followers and understand the algorithms. You create content that gets shared,
            saved, and drives traffic to affiliate offers without being salesy.""",
            verbose=Config.CREWAI_VERBOSE,
            allow_delegation=False
        )
    
    @agent
    def video_scripter(self) -> Agent:
        """Agent that writes video scripts"""
        return Agent(
            role="Video Script Writer",
            goal="Write engaging video scripts that hook viewers and drive action",
            backstory="""You are a video content specialist who has written scripts for videos 
            with millions of views. You understand the 3-second hook rule, pattern interrupts,
            and how to structure content for retention. Your scripts work for YouTube ads,
            TikTok videos, VSLs, and webinars. You know how to tell stories that sell.""",
            verbose=Config.CREWAI_VERBOSE,
            allow_delegation=False
        )
    
    # =========================================================================
    # TASKS
    # =========================================================================
    
    @task
    def create_ad_copy_task(self) -> Task:
        """Task to create ad copy for multiple platforms"""
        return Task(
            description="""Create high-converting ad copy based on:
            
            Input: {input}
            
            Create ad copy for:
            1. Facebook/Instagram Ads (3 variations)
            2. Google Ads (3 variations)
            3. Native Ads (2 variations)
            
            Each ad should include:
            - Attention-grabbing headline
            - Benefit-focused body copy
            - Clear call-to-action
            - Appropriate length for platform
            
            Use proven frameworks: AIDA, PAS, or BAB""",
            expected_output="""8 ad copy variations with:
            - Platform specification
            - Headline
            - Body copy
            - CTA
            - Character count""",
            agent=self.copywriter()
        )
    
    @task
    def create_email_sequence_task(self) -> Task:
        """Task to create email nurture sequence"""
        return Task(
            description="""Create a 5-email nurture sequence that:
            
            1. Welcome email - Deliver lead magnet, set expectations
            2. Value email - Provide useful content, build trust
            3. Story email - Share relatable story, introduce problem
            4. Solution email - Present affiliate product as solution
            5. Urgency email - Create scarcity, final push
            
            Each email needs:
            - Subject line (with emoji option)
            - Preview text
            - Full HTML-ready body
            - Send timing recommendation""",
            expected_output="""5-email sequence with:
            - Subject lines
            - Preview text
            - Full body copy
            - Send schedule""",
            agent=self.email_specialist(),
            context=[self.create_ad_copy_task()]
        )
    
    @task
    def create_social_content_task(self) -> Task:
        """Task to create social media content"""
        return Task(
            description="""Create social media content for:
            
            1. Twitter/X - 5 tweets (thread + standalone)
            2. LinkedIn - 2 posts (professional angle)
            3. Instagram - 3 captions (with hashtag suggestions)
            4. TikTok - 2 video concepts with hooks
            
            Content should:
            - Be native to each platform
            - Drive engagement (likes, comments, shares)
            - Subtly promote the affiliate offer
            - Include relevant hashtags where appropriate""",
            expected_output="""12 social media posts with:
            - Platform specification
            - Full post text
            - Hashtags (where applicable)
            - Best posting time suggestion""",
            agent=self.social_media_expert(),
            context=[self.create_ad_copy_task()]
        )
    
    @task
    def create_video_script_task(self) -> Task:
        """Task to create video script"""
        return Task(
            description="""Create a video script for a 2-3 minute promotional video:
            
            Structure:
            1. Hook (0-3 seconds) - Stop the scroll
            2. Problem (10-20 seconds) - Agitate the pain
            3. Solution (30-45 seconds) - Introduce the product
            4. Benefits (30-45 seconds) - Key features and outcomes
            5. Social Proof (15-20 seconds) - Testimonials/results
            6. CTA (10-15 seconds) - Clear next step
            
            Include:
            - Visual/B-roll suggestions
            - On-screen text recommendations
            - Music/tone guidance""",
            expected_output="""Complete video script with:
            - Timestamped sections
            - Spoken dialogue
            - Visual directions
            - On-screen text suggestions""",
            agent=self.video_scripter(),
            context=[self.create_ad_copy_task()],
            output_pydantic=ContentGenerationOutput
        )
    
    # =========================================================================
    # CREW
    # =========================================================================
    
    @crew
    def crew(self) -> Crew:
        """Creates the Content Generation crew"""
        return Crew(
            agents=[
                self.copywriter(),
                self.email_specialist(),
                self.social_media_expert(),
                self.video_scripter()
            ],
            tasks=[
                self.create_ad_copy_task(),
                self.create_email_sequence_task(),
                self.create_social_content_task(),
                self.create_video_script_task()
            ],
            process=Process.sequential,
            verbose=Config.CREWAI_VERBOSE
        )
    
    # =========================================================================
    # EXECUTION
    # =========================================================================
    
    async def execute(self, request: str) -> Dict[str, Any]:
        """Execute the crew with the given request"""
        result = self.crew().kickoff(inputs={"input": request})
        return {
            "core": CoreType.CONTENT_GENERATION.value,
            "status": "completed",
            "result": result.model_dump() if hasattr(result, 'model_dump') else str(result)
        }
    
    def execute_sync(self, request: str) -> Dict[str, Any]:
        """Synchronous execution wrapper"""
        import asyncio
        return asyncio.run(self.execute(request))


# =============================================================================
# CLI FOR TESTING
# =============================================================================

if __name__ == "__main__":
    crew = ContentGenerationCrew()
    result = crew.execute_sync("Create marketing content for a finance course affiliate product priced at $297")
    print(result)
