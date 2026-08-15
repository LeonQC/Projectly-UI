import React from "react";

function shortenSha(sha) {
  return sha ? sha.slice(0, 7) : "";
}

function RepoLabel({ link }) {
  return (
    <span>
      {link.repo_owner}/{link.repo_name}
    </span>
  );
}

function ProjectDevelopmentCard({ item, onOpenCard }) {
  const { card, development } = item;
  const links = development.github_links ?? [];
  const commits = [...(development.linked_commits ?? []), ...(development.recent_commits ?? [])].slice(0, 4);
  const hasDevelopment = development.development_status?.has_github_links;

  return (
    <article className="project-development-card">
      <header>
        <button type="button" onClick={() => onOpenCard(card)}>
          {card.title}
        </button>
        <span>{card.status.replaceAll("_", " ")}</span>
      </header>

      {hasDevelopment ? (
        <div className="project-development-content">
          <div className="project-development-summary">
            <span>{development.development_status.link_count} links</span>
            <span>{development.development_status.branch_count} branches</span>
            <span>{development.development_status.pull_request_count} PRs</span>
            <span>{development.development_status.commit_count} commits</span>
          </div>

          <div className="project-development-links">
            {links.map((link) => (
              <a
                href={link.url || `https://github.com/${link.repo_owner}/${link.repo_name}`}
                target="_blank"
                rel="noreferrer"
                key={link.id}
              >
                <strong><RepoLabel link={link} /></strong>
                <span>
                  {[
                    link.branch_name ? `branch ${link.branch_name}` : "",
                    link.pull_request_number ? `PR #${link.pull_request_number}` : "",
                    link.commit_sha ? `commit ${shortenSha(link.commit_sha)}` : "",
                  ].filter(Boolean).join(" · ") || "Repository link"}
                </span>
              </a>
            ))}
          </div>

          {development.pull_requests.length > 0 && (
            <div className="project-development-list">
              <h3>Pull requests</h3>
              {development.pull_requests.map((pullRequest) => (
                <a
                  href={pullRequest.url}
                  target="_blank"
                  rel="noreferrer"
                  key={`${pullRequest.repo_owner}/${pullRequest.repo_name}/${pullRequest.number}`}
                >
                  <strong>#{pullRequest.number} {pullRequest.title}</strong>
                  <span>{pullRequest.merged ? "merged" : pullRequest.state}</span>
                </a>
              ))}
            </div>
          )}

          {commits.length > 0 && (
            <div className="project-development-list">
              <h3>Recent commits</h3>
              {commits.map((commit) => (
                <a href={commit.url} target="_blank" rel="noreferrer" key={`${commit.repo_owner}/${commit.repo_name}/${commit.sha}`}>
                  <strong>{commit.message.split("\n")[0]}</strong>
                  <span>{shortenSha(commit.sha)} · {commit.author_name ?? "Unknown author"}</span>
                </a>
              ))}
            </div>
          )}
        </div>
      ) : (
        <p className="project-development-empty">No development links for this card.</p>
      )}
    </article>
  );
}

function ProjectDevelopment({ development, isLoading, onOpenCard }) {
  const cards = development?.cards ?? [];

  if (isLoading) {
    return (
      <div className="project-development-page">
        <p className="empty-state">Loading development...</p>
      </div>
    );
  }

  return (
    <div className="project-development-page">
      {cards.length > 0 ? (
        cards.map((item) => (
          <ProjectDevelopmentCard item={item} onOpenCard={onOpenCard} key={item.card.id} />
        ))
      ) : (
        <p className="empty-state">No cards in this project yet.</p>
      )}
    </div>
  );
}

export default ProjectDevelopment;
