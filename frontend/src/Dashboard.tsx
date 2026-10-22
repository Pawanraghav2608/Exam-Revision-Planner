import { useEffect, useState, type CSSProperties, type FormEvent } from 'react';
import { apiRequest } from './api';

type DashboardTab = 'overview' | 'subjects' | 'schedule' | 'settings';
type SessionFilter = 'upcoming' | 'completed' | 'all';
type PlanDay = { label: string; value: number };

type Subject = {
  id: string;
  name: string;
  exam_date: string;
};

type StudySession = {
  id: string;
  subject_id: string;
  study_date: string;
  start_time: string;
  end_time: string;
  topic: string;
  break_minutes: number;
  status: string;
};

type WeakTopic = {
  id: string;
  subject_id: string;
  title: string;
  confidence: number;
};

type Profile = {
  display_name: string;
  weekly_free_hours: number;
};

type DashboardProps = {
  token: string;
};

function formatDate(date: string): { day: string; date: string } {
  const parsed = new Date(`${date}T12:00:00`);
  return {
    day: parsed.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
    date: parsed.toLocaleDateString('en-US', { day: '2-digit' }),
  };
}

function formatTime(time: string): string {
  const [hours = '0', minutes = '00'] = time.split(':');
  const hour = Number(hours);
  return `${hour % 12 || 12}:${minutes} ${hour >= 12 ? 'PM' : 'AM'}`;
}

function formatExamDate(date: string): string {
  return new Date(`${date}T12:00:00`).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function localDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const planDays: PlanDay[] = [
  { label: 'Mon', value: 1 }, { label: 'Tue', value: 2 }, { label: 'Wed', value: 3 },
  { label: 'Thu', value: 4 }, { label: 'Fri', value: 5 }, { label: 'Sat', value: 6 },
  { label: 'Sun', value: 0 },
];

function Dashboard({ token }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [sessionFilter, setSessionFilter] = useState<SessionFilter>('upcoming');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [topics, setTopics] = useState<WeakTopic[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileName, setProfileName] = useState('');
  const [weeklyFreeHours, setWeeklyFreeHours] = useState(8);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileMessage, setProfileMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [breakSeconds, setBreakSeconds] = useState(5 * 60);
  const [breakMinutes, setBreakMinutes] = useState(5);
  const [breakActive, setBreakActive] = useState(false);
  const [breakComplete, setBreakComplete] = useState(false);
  const [breakIndex, setBreakIndex] = useState(0);
  const [factIndex, setFactIndex] = useState(0);
  const [showSubjectForm, setShowSubjectForm] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newExamDate, setNewExamDate] = useState('');
  const [savingSubject, setSavingSubject] = useState(false);
  const [subjectFormError, setSubjectFormError] = useState('');
  const [showTopicForm, setShowTopicForm] = useState(false);
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicSubject, setNewTopicSubject] = useState('');
  const [newTopicConfidence, setNewTopicConfidence] = useState(2);
  const [savingTopic, setSavingTopic] = useState(false);
  const [topicFormError, setTopicFormError] = useState('');
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [planStartDate, setPlanStartDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return localDateString(tomorrow);
  });
  const [planStudyDays, setPlanStudyDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [planStartTime, setPlanStartTime] = useState('18:00');
  const [planSessionMinutes, setPlanSessionMinutes] = useState(60);
  const [planBreakMinutes, setPlanBreakMinutes] = useState(10);
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [planError, setPlanError] = useState('');
  const [planMessage, setPlanMessage] = useState('');

  const breakIdeas = [
    'Take a short walk and let your eyes look into the distance.',
    'Drink a glass of water and stretch your shoulders gently.',
    'Stand up, roll your shoulders, and take five slow breaths.',
    'Tidy your desk and give your eyes a screen-free moment.',
  ];
  const funFacts = [
    'An octopus has three hearts.',
    'A day on Venus lasts longer than its year.',
    'Botanically, bananas are berries, but strawberries are not.',
    'A group of flamingos is called a flamboyance.',
  ];

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      setLoading(true);
      setError('');

      try {
        const [subjectResult, sessionResult, topicResult, profileResult] = await Promise.all([
          apiRequest<{ subjects: Subject[] }>('/api/subjects', token),
          apiRequest<{ study_sessions: StudySession[] }>('/api/study-sessions', token),
          apiRequest<{ weak_topics: WeakTopic[] }>('/api/weak-topics', token),
          apiRequest<{ profile: Profile | null }>('/api/profile', token),
        ]);

        if (!cancelled) {
          setSubjects(subjectResult.subjects ?? []);
          setSessions(sessionResult.study_sessions ?? []);
          setTopics(topicResult.weak_topics ?? []);
          setProfile(profileResult.profile);
          setProfileName(profileResult.profile?.display_name ?? '');
          setWeeklyFreeHours(profileResult.profile?.weekly_free_hours ?? 8);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not load your study plan.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadDashboard();
    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    if (!breakActive) return;
    const timer = window.setInterval(() => {
      setBreakSeconds((seconds) => Math.max(0, seconds - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [breakActive]);

  useEffect(() => {
    if (breakActive && breakSeconds === 0) {
      setBreakActive(false);
      setBreakComplete(true);
    }
  }, [breakActive, breakSeconds]);

  useEffect(() => {
    if (!breakActive) return;
    const factsTimer = window.setInterval(() => {
      setFactIndex((index) => (index + 1) % funFacts.length);
    }, 12000);
    return () => window.clearInterval(factsTimer);
  }, [breakActive, funFacts.length]);

  const subjectName = (subjectId: string) =>
    subjects.find((subject) => subject.id === subjectId)?.name ?? 'Study session';
  const today = localDateString(new Date());
  const pendingSessions = sessions.filter((session) => session.status !== 'completed' && session.study_date >= today);
  const nextSession = pendingSessions[0];
  const visibleSessions = (activeTab === 'schedule' ? sessions : pendingSessions.slice(0, 2))
    .filter((session) => activeTab !== 'schedule' || sessionFilter === 'all'
      || (sessionFilter === 'completed'
        ? session.status === 'completed'
        : session.status !== 'completed' && session.study_date >= today));
  const timerText = `${String(Math.floor(breakSeconds / 60)).padStart(2, '0')}:${String(breakSeconds % 60).padStart(2, '0')}`;
  const breakProgress = 100 - (breakSeconds / (breakMinutes * 60)) * 100;
  const timerStyle = { '--timer-progress': `${breakProgress}%` } as CSSProperties;

  function toggleBreak() {
    if (breakActive) {
      setBreakActive(false);
      return;
    }
    if (breakSeconds === 0) setBreakSeconds(breakMinutes * 60);
    setBreakComplete(false);
    setBreakIndex(Math.floor(Math.random() * breakIdeas.length));
    setBreakActive(true);
  }

  function endBreak() {
    setBreakActive(false);
    setBreakComplete(false);
    setBreakSeconds(breakMinutes * 60);
  }

  async function addSubject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubjectFormError('');
    setSavingSubject(true);
    try {
      const result = await apiRequest<{ subject: Subject }>('/api/subjects', token, {
        method: 'POST',
        body: JSON.stringify({ name: newSubjectName.trim(), exam_date: newExamDate }),
      });
      setSubjects((current) => [...current, result.subject].sort((a, b) => a.exam_date.localeCompare(b.exam_date)));
      setNewSubjectName('');
      setNewExamDate('');
      setShowSubjectForm(false);
    } catch (err) {
      setSubjectFormError(err instanceof Error ? err.message : 'Could not add this subject.');
    } finally {
      setSavingSubject(false);
    }
  }

  async function addTopic(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTopicFormError('');
    setSavingTopic(true);
    try {
      const result = await apiRequest<{ weak_topic: WeakTopic }>('/api/weak-topics', token, {
        method: 'POST',
        body: JSON.stringify({
          subject_id: newTopicSubject,
          title: newTopicTitle.trim(),
          confidence: Number(newTopicConfidence),
        }),
      });
      setTopics((current) => [...current, result.weak_topic].sort((a, b) => a.confidence - b.confidence));
      setNewTopicTitle('');
      setShowTopicForm(false);
    } catch (err) {
      setTopicFormError(err instanceof Error ? err.message : 'Could not add this focus topic.');
    } finally {
      setSavingTopic(false);
    }
  }

  async function updateSessionStatus(sessionId: string, status: 'planned' | 'completed') {
    try {
      const result = await apiRequest<{ study_session: StudySession }>(
        `/api/study-sessions/${sessionId}/status`,
        token,
        { method: 'PATCH', body: JSON.stringify({ status }) },
      );
      setSessions((current) => current.map((session) =>
        session.id === sessionId ? result.study_session : session,
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update this session.');
    }
  }

  async function generatePlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPlanError('');
    setPlanMessage('');
    setGeneratingPlan(true);
    try {
      const result = await apiRequest<{
        message: string;
        study_sessions: StudySession[];
      }>('/api/plans/generate', token, {
        method: 'POST',
        body: JSON.stringify({
          start_date: planStartDate,
          study_days: planStudyDays,
          start_time: planStartTime,
          session_minutes: planSessionMinutes,
          sessions_per_day: 1,
          break_minutes: planBreakMinutes,
        }),
      });
      setSessions((current) => [...current, ...result.study_sessions].sort((a, b) =>
        `${a.study_date}T${a.start_time}`.localeCompare(`${b.study_date}T${b.start_time}`),
      ));
      setPlanMessage(`${result.message} (${result.study_sessions.length} sessions).`);
      setShowPlanForm(false);
      setActiveTab('schedule');
    } catch (err) {
      setPlanError(err instanceof Error ? err.message : 'Could not generate your plan.');
    } finally {
      setGeneratingPlan(false);
    }
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProfileError('');
    setProfileMessage('');
    setSavingProfile(true);
    try {
      const result = await apiRequest<{ profile: Profile }>('/api/profile', token, {
        method: 'PUT',
        body: JSON.stringify({
          display_name: profileName.trim(),
          weekly_free_hours: Number(weeklyFreeHours),
        }),
      });
      setProfile(result.profile);
      setProfileMessage('Your profile and weekly availability are saved.');
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'Could not save your profile.');
    } finally {
      setSavingProfile(false);
    }
  }

  return (
    <section className="dashboard-section" id="dashboard">
      <div className="dashboard-heading">
        <div>
          <span className="eyebrow">YOUR STUDY SPACE</span>
          <h2>A plan that keeps <span>you moving.</span></h2>
          <p>Your revision at a glance. One focused session at a time.</p>
        </div>
        <span className="dashboard-date">YOUR PERSONAL PLAN <b>↗</b></span>
      </div>

      <div className="dashboard-layout">
        <aside className="dashboard-sidebar">
          <div className="student-card">
            <span className="student-avatar">P</span>
            <span><strong>Hi, {profile?.display_name || 'there'}</strong><small>Keep your rhythm</small></span>
            <span className="student-spark">✳</span>
          </div>

          <p className="sidebar-label">YOUR PLANNER</p>
          <button className={`dash-nav ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
            <span>◫</span> Overview
          </button>
          <button className={`dash-nav ${activeTab === 'subjects' ? 'active' : ''}`} onClick={() => setActiveTab('subjects')}>
            <span>▤</span> My subjects
          </button>
          <button className={`dash-nav ${activeTab === 'schedule' ? 'active' : ''}`} onClick={() => setActiveTab('schedule')}>
            <span>▦</span> Study schedule
          </button>
          <button className={`dash-nav ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
            <span>◉</span> Profile & availability
          </button>

          <div className="sidebar-tip">
            <span>✦ A gentle reminder</span>
            <p>Consistency beats cramming. You’re building a good habit.</p>
          </div>
        </aside>

        <div className="dashboard-main">
          <div className="dashboard-topline">
            <div>
              <span className="card-kicker">YOUR SAVED REVISION PLAN</span>
              <h3>
                {activeTab === 'subjects'
                  ? 'Your subjects'
                  : activeTab === 'schedule'
                    ? 'Study schedule'
                    : activeTab === 'settings'
                      ? 'Your study availability'
                      : 'You’re right on track'}
              </h3>
            </div>
            <button className="dashboard-add" type="button" onClick={() => { setShowSubjectForm((value) => !value); setSubjectFormError(''); }}>
              <span>＋</span> Add subject
            </button>
            <button className="plan-generate-button" type="button" disabled={subjects.length === 0 || !profile} title={!profile ? 'Save your profile and weekly hours first' : ''} onClick={() => { setShowPlanForm((value) => !value); setPlanError(''); setPlanMessage(''); }}>
              ✦ Generate AI plan
            </button>
          </div>

          {!loading && !profile && activeTab !== 'settings' && (
            <button className="availability-reminder" type="button" onClick={() => setActiveTab('settings')}>
              Set your weekly study hours before generating a plan →
            </button>
          )}

          {planMessage && <p className="plan-status" role="status">{planMessage}</p>}
          {planError && <p className="plan-status plan-error" role="alert">{planError}</p>}

          {showPlanForm && (
            <form className="plan-form" onSubmit={generatePlan}>
              <div className="subject-form-heading"><strong>Build your four-week revision plan</strong><button type="button" onClick={() => setShowPlanForm(false)} aria-label="Close plan form">×</button></div>
              <label>Start date<input type="date" value={planStartDate} min={localDateString(new Date())} onChange={(event) => setPlanStartDate(event.target.value)} required /></label>
              <fieldset className="plan-weekdays">
                <legend>Study days</legend>
                {planDays.map((day) => (
                  <label className={planStudyDays.includes(day.value) ? 'selected' : ''} key={day.value}>
                    <input type="checkbox" checked={planStudyDays.includes(day.value)} onChange={() => setPlanStudyDays((current) => current.includes(day.value) ? current.filter((value) => value !== day.value) : [...current, day.value])} />
                    {day.label}
                  </label>
                ))}
              </fieldset>
              <label>Start time<input type="time" value={planStartTime} onChange={(event) => setPlanStartTime(event.target.value)} required /></label>
              <label>Study session
                <select value={planSessionMinutes} onChange={(event) => setPlanSessionMinutes(Number(event.target.value))}>
                  {[30, 45, 60, 90, 120].map((minutes) => <option value={minutes} key={minutes}>{minutes} minutes</option>)}
                </select>
              </label>
              <label>Break between sessions
                <select value={planBreakMinutes} onChange={(event) => setPlanBreakMinutes(Number(event.target.value))}>
                  {[5, 10, 15, 20].filter((minutes) => minutes < planSessionMinutes).map((minutes) => <option value={minutes} key={minutes}>{minutes} minutes</option>)}
                </select>
              </label>
              <button className="subject-save" type="submit" disabled={generatingPlan || planStudyDays.length === 0 || subjects.length === 0}>{generatingPlan ? 'Creating your plan…' : 'Generate my plan'}</button>
              {planError && <p className="auth-error" role="alert">{planError}</p>}
              <p className="plan-hint">We’ll fit sessions around your exam dates and prioritize your focus topics.</p>
            </form>
          )}

          {showSubjectForm && (
            <form className="subject-form" onSubmit={addSubject}>
              <div className="subject-form-heading"><strong>Add a subject</strong><button type="button" onClick={() => setShowSubjectForm(false)} aria-label="Close add subject form">×</button></div>
              <label>Subject name<input value={newSubjectName} onChange={(event) => setNewSubjectName(event.target.value)} placeholder="e.g. Biology" maxLength={100} required /></label>
              <label>Exam date<input type="date" value={newExamDate} onChange={(event) => setNewExamDate(event.target.value)} required /></label>
              {subjectFormError && <p className="auth-error" role="alert">{subjectFormError}</p>}
              <button className="subject-save" type="submit" disabled={savingSubject}>{savingSubject ? 'Saving…' : 'Save subject'}</button>
            </form>
          )}

          {activeTab === 'subjects' && !loading && !error && (
            <div className="topic-form-area">
              <button className="dashboard-add" type="button" onClick={() => { setShowTopicForm((value) => !value); setTopicFormError(''); }}>
                <span>＋</span> Add focus topic
              </button>
              {showTopicForm && (
                <form className="subject-form topic-form" onSubmit={addTopic}>
                  <div className="subject-form-heading"><strong>Add a topic to revisit</strong><button type="button" onClick={() => setShowTopicForm(false)} aria-label="Close add topic form">×</button></div>
                  <label>Subject
                    <select value={newTopicSubject} onChange={(event) => setNewTopicSubject(event.target.value)} required>
                      <option value="">Choose subject</option>
                      {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
                    </select>
                  </label>
                  <label>Topic name<input value={newTopicTitle} onChange={(event) => setNewTopicTitle(event.target.value)} placeholder="e.g. Meiosis" maxLength={150} required /></label>
                  <label>Confidence
                    <select value={newTopicConfidence} onChange={(event) => setNewTopicConfidence(Number(event.target.value))}>
                      <option value={1}>1 · Need lots of practice</option>
                      <option value={2}>2 · Still tricky</option>
                      <option value={3}>3 · Getting there</option>
                      <option value={4}>4 · Mostly confident</option>
                      <option value={5}>5 · Confident</option>
                    </select>
                  </label>
                  {topicFormError && <p className="auth-error" role="alert">{topicFormError}</p>}
                  <button className="subject-save" type="submit" disabled={savingTopic || subjects.length === 0}>{savingTopic ? 'Saving…' : 'Save topic'}</button>
                </form>
              )}
            </div>
          )}

          {loading ? (
            <p className="dashboard-message" role="status">Loading your plan…</p>
          ) : error ? (
            <p className="dashboard-message dashboard-error" role="alert">{error}</p>
          ) : activeTab === 'settings' ? (
            <form className="profile-form" onSubmit={saveProfile}>
              <p>Tell PrepPulse how much time you can study in a normal week. The planner uses this to keep your schedule realistic.</p>
              <label>Your name<input value={profileName} onChange={(event) => setProfileName(event.target.value)} maxLength={100} placeholder="Your name" required /></label>
              <label>Free study hours each week<input type="number" min={1} max={80} value={weeklyFreeHours} onChange={(event) => setWeeklyFreeHours(Number(event.target.value))} required /></label>
              {profileError && <p className="auth-error" role="alert">{profileError}</p>}
              {profileMessage && <p className="profile-success" role="status">{profileMessage}</p>}
              <button className="subject-save" type="submit" disabled={savingProfile}>{savingProfile ? 'Saving…' : 'Save availability'}</button>
            </form>
          ) : activeTab === 'subjects' ? (
            <div className="subject-panel">
              {subjects.length ? subjects.map((subject) => {
                const subjectTopics = topics.filter((topic) => topic.subject_id === subject.id);
                const subjectSessions = sessions
                  .filter((session) => session.subject_id === subject.id)
                  .sort((a, b) => a.study_date.localeCompare(b.study_date) || a.start_time.localeCompare(b.start_time));
                const completedCount = subjectSessions.filter((session) => session.status === 'completed').length;
                const progress = subjectSessions.length ? Math.round((completedCount / subjectSessions.length) * 100) : 0;
                return (
                  <article className="subject-tile" key={subject.id}>
                    <div className="subject-tile-head">
                      <span className="subject-tile-icon">📚</span>
                      <div className="subject-title">
                        <strong>{subject.name}</strong>
                        <small>Exam · {formatExamDate(subject.exam_date)}</small>
                      </div>
                      <span className="subject-count">{subjectTopics.length} focus topics</span>
                    </div>
                    <div className="subject-progress" aria-label={`${progress}% of study sessions completed`}><span style={{ width: `${progress}%` }} /></div>
                    <small className="subject-progress-label">{completedCount} of {subjectSessions.length} study sessions completed</small>
                    <div className="subject-topic-chips">
                      {subjectTopics.length
                        ? subjectTopics.map((topic) => <span key={topic.id}>{topic.title}</span>)
                        : <small>No focus topics added yet.</small>}
                    </div>
                    <div className="subject-sessions">
                      <strong>Study sessions</strong>
                      {subjectSessions.length ? subjectSessions.slice(0, 3).map((session) => {
                        const date = formatDate(session.study_date);
                        return (
                          <div className="subject-session-row" key={session.id}>
                            <span><b>{date.day} {date.date}</b><small>{formatTime(session.start_time)} · {session.topic}</small></span>
                            <button
                              className={session.status === 'completed' ? 'session-undo' : ''}
                              type="button"
                              onClick={() => void updateSessionStatus(session.id, session.status === 'completed' ? 'planned' : 'completed')}
                            >{session.status === 'completed' ? 'Undo' : 'Mark done'}</button>
                          </div>
                        );
                      }) : <small>No sessions yet. Generate a plan to add sessions.</small>}
                      {subjectSessions.length > 3 && <button className="subject-view-schedule" type="button" onClick={() => setActiveTab('schedule')}>View all {subjectSessions.length} sessions →</button>}
                    </div>
                  </article>
                );
              }) : (
                <p className="dashboard-message">No subjects yet. Add a subject to start your plan.</p>
              )}
            </div>
          ) : (
            <>
              <div className="dashboard-stats">
                <article className="dash-stat stat-subjects"><span>SUBJECTS</span><strong>{String(subjects.length).padStart(2, '0')}</strong><small>In your planner</small><i>▤</i></article>
                <article className="dash-stat stat-sessions"><span>STUDY SESSIONS</span><strong>{String(sessions.filter((session) => session.status === 'completed').length).padStart(2, '0')}</strong><small>of {sessions.length} completed</small><i>◷</i></article>
                <article className="dash-stat stat-hours"><span>UP NEXT</span><strong>{nextSession ? '↗' : '—'}</strong><small>{nextSession ? `${subjectName(nextSession.subject_id)} · ${formatDate(nextSession.study_date).day} ${formatDate(nextSession.study_date).date} · ${formatTime(nextSession.start_time)}` : 'Nothing scheduled'}</small><i>✦</i></article>
              </div>

              <div className="schedule-card">
                <div className="schedule-card-head">
                  <div><span className="card-kicker">{activeTab === 'schedule' ? 'YOUR STUDY SESSIONS' : 'YOUR UPCOMING SESSIONS'}</span><h4>{activeTab === 'schedule' ? 'Your schedule' : 'Keep the momentum'}</h4></div>
                  <button className="view-all" onClick={() => setActiveTab('schedule')}>View all ↗</button>
                </div>
                {activeTab === 'schedule' && (
                  <div className="schedule-filters" role="group" aria-label="Filter study sessions">
                    {(['upcoming', 'completed', 'all'] as SessionFilter[]).map((filter) => (
                      <button
                        className={sessionFilter === filter ? 'active' : ''}
                        type="button"
                        key={filter}
                        aria-pressed={sessionFilter === filter}
                        onClick={() => setSessionFilter(filter)}
                      >
                        {filter === 'upcoming' ? 'Upcoming' : filter === 'completed' ? 'Completed' : 'All'}
                        <span>{filter === 'upcoming'
                            ? pendingSessions.length
                          : filter === 'completed'
                            ? sessions.filter((session) => session.status === 'completed').length
                            : sessions.length}</span>
                      </button>
                    ))}
                  </div>
                )}
                <div className="schedule-list">
                  {visibleSessions.length ? visibleSessions.map((session, index) => {
                    const date = formatDate(session.study_date);
                    const colors = ['blush', 'plum', 'rose'];
                    return (
                      <article className={`schedule-item ${session.status === 'completed' ? 'session-completed' : ''}`} key={session.id}>
                        <div className="schedule-date"><small>{date.day}</small><strong>{date.date}</strong></div>
                        <span className={`schedule-marker ${colors[index % colors.length]}`} />
                        <div className="schedule-info"><strong>{session.topic}</strong><small>{formatTime(session.start_time)} <span>·</span> {subjectName(session.subject_id)}</small></div>
                        <button
                          className={`session-complete ${session.status === 'completed' ? 'session-undo' : ''}`}
                          type="button"
                          onClick={() => void updateSessionStatus(session.id, session.status === 'completed' ? 'planned' : 'completed')}
                        >{session.status === 'completed' ? 'Undo' : 'Mark done'}</button>
                      </article>
                    );
                  }) : (
                    <p className="dashboard-message">{sessions.length ? 'No sessions in this view yet.' : 'No study sessions saved yet. Generate a plan to see it here.'}</p>
                  )}
                </div>
              </div>
              <section className="topics-card">
                <div className="schedule-card-head">
                  <div><span className="card-kicker">AREAS TO REVISIT</span><h4>Your focus topics</h4></div>
                  <span className="topic-total">{topics.length} topics</span>
                </div>
                {topics.length ? (
                  <div className="focus-topic-list">
                    {topics.slice(0, 4).map((topic) => (
                      <div className="focus-topic-item" key={topic.id}>
                        <span className="topic-dot" />
                        <strong>{topic.title}</strong>
                        <small>{subjectName(topic.subject_id)} · confidence {topic.confidence}/5</small>
                      </div>
                    ))}
                  </div>
                ) : <p className="dashboard-message">No focus topics yet. Add weak topics to your planner to see them here.</p>}
              </section>
            </>
          )}
        </div>
      </div>

      <section className={`break-panel ${breakActive ? 'break-running' : ''}`}>
        <div className="break-copy">
          <span className="card-kicker">A LITTLE RESET</span>
          <h3>{breakComplete ? 'Break complete. Ready when you are.' : breakActive ? 'Step away from your screen.' : `Take a ${breakMinutes}-minute breather.`}</h3>
          <p>{breakActive ? breakIdeas[breakIndex] : 'Stretch, take a short walk, or grab some water. A small pause belongs in a good study plan.'}</p>
          <div className="break-fact" key={factIndex}><span>QUICK FACT · CHANGES EVERY 12 SECONDS</span><strong>{funFacts[factIndex]}</strong></div>
        </div>
        <div className="break-clock">
          <label className="break-duration">
            Break length
            <select
              value={breakMinutes}
              disabled={breakActive}
              onChange={(event) => {
                const minutes = Number(event.target.value);
                setBreakMinutes(minutes);
                setBreakSeconds(minutes * 60);
                setBreakComplete(false);
              }}
            >
              {[1, 5, 10, 15, 20].map((minutes) => <option key={minutes} value={minutes}>{minutes} min</option>)}
            </select>
          </label>
          <span className={`break-timer-dial ${breakActive ? 'is-running' : ''}`} style={timerStyle}>
            <span className="timer-water" aria-hidden="true" />
            <span className="break-timer" aria-live="polite">{timerText}</span>
          </span>
          <button className="break-start" onClick={toggleBreak}>{breakActive ? 'Pause break' : breakSeconds < breakMinutes * 60 && breakSeconds > 0 ? 'Resume break' : breakComplete ? 'Start again' : 'Start break'}</button>
          {(breakActive || breakComplete || breakSeconds < breakMinutes * 60) && <button className="break-end" onClick={endBreak}>{breakComplete ? 'Reset timer' : 'End break'}</button>}
        </div>
      </section>
    </section>
  );
}

export default Dashboard;
