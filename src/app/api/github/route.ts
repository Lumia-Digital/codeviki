import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { repoUrl } = await request.json();

    if (!repoUrl) {
      return NextResponse.json({ error: 'Repository URL is required' }, { status: 400 });
    }

    // Parse GitHub URL
    const match = repoUrl.match(/github\.com\/([^/]+)\/([^/\s?.#]+)/);
    if (!match) {
      return NextResponse.json({ error: 'Invalid GitHub URL' }, { status: 400 });
    }

    const [, owner, repo] = match;
    const repoName = repo.replace('.git', '');

    const githubToken = process.env.GITHUB_TOKEN;
    const commonHeaders: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
    };
    if (githubToken) {
      commonHeaders['Authorization'] = `token ${githubToken}`;
    }

    // Fetch repo info from GitHub API
    const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}`, {
      headers: commonHeaders,
    });

    if (!repoRes.ok) {
      if (repoRes.status === 403 || repoRes.status === 429) {
        return NextResponse.json({ 
          error: 'GitHub API Rate Limit Exceeded. Please add a GITHUB_TOKEN to your .env file to increase limits.',
          suggestion: 'Create a token at https://github.com/settings/tokens'
        }, { status: 429 });
      }
      return NextResponse.json({ error: 'Repository not found or is private' }, { status: 404 });
    }

    const repoData = await repoRes.json();

    // Fetch file tree (recursive)
    const treeRes = await fetch(
      `https://api.github.com/repos/${owner}/${repoName}/git/trees/${repoData.default_branch}?recursive=1`,
      { headers: commonHeaders }
    );

    if (!treeRes.ok) {
      if (treeRes.status === 403 || treeRes.status === 429) {
        return NextResponse.json({ error: 'GitHub API Rate Limit Exceeded during tree fetch.' }, { status: 429 });
      }
      return NextResponse.json({ error: 'Failed to fetch repository tree' }, { status: 500 });
    }

    const treeData = await treeRes.json();

    // Filter to important files and fetch their content
    const IGNORE_DIRS = ['node_modules', '.git', 'dist', 'build', '__pycache__', '.next', 'vendor', 'target'];
    const CODE_EXTS = ['.ts', '.tsx', '.js', '.jsx', '.py', '.go', '.rs', '.java', '.rb', '.php', '.vue', '.svelte', '.c', '.cpp', '.h', '.cs', '.kt', '.swift'];
    const CONFIG_FILES = ['package.json', 'tsconfig.json', 'README.md', 'readme.md', '.env.example', 'Cargo.toml', 'go.mod', 'requirements.txt', 'pyproject.toml', 'Dockerfile', 'docker-compose.yml'];

    const blobs = (treeData.tree || []).filter((item: { type: string; path: string; size?: number }) => {
      if (item.type !== 'blob') return false;
      if (IGNORE_DIRS.some(d => item.path.includes(`${d}/`))) return false;
      const name = item.path.split('/').pop() || '';
      const ext = name.substring(name.lastIndexOf('.'));
      if (CONFIG_FILES.includes(name)) return true;
      if (CODE_EXTS.includes(ext) && (item.size || 0) < 10000) return true;
      return false;
    });

    // Limit to 50 most important files
    const filesToFetch = blobs.slice(0, 50);

    // Fetch file contents in parallel (batches of 10)
    const files: { path: string; content: string }[] = [];
    for (let i = 0; i < filesToFetch.length; i += 10) {
      const batch = filesToFetch.slice(i, i + 10);
      const contents = await Promise.all(
        batch.map(async (item: { path: string }) => {
          try {
            const res = await fetch(
              `https://api.github.com/repos/${owner}/${repoName}/contents/${item.path}?ref=${repoData.default_branch}`,
              { 
                headers: { 
                  ...commonHeaders,
                  'Accept': 'application/vnd.github.v3.raw' 
                } 
              }
            );
            if (res.ok) {
              const content = await res.text();
              return { path: item.path, content };
            }
          } catch { /* skip */ }
          return null;
        })
      );
      files.push(...contents.filter(Boolean) as { path: string; content: string }[]);
    }

    return NextResponse.json({
      success: true,
      repo: {
        name: repoData.name,
        fullName: repoData.full_name,
        description: repoData.description,
        language: repoData.language,
        stars: repoData.stargazers_count,
        forks: repoData.forks_count,
        defaultBranch: repoData.default_branch,
        url: repoData.html_url,
      },
      files,
      totalFilesInRepo: treeData.tree?.length || 0,
      fetchedFiles: files.length,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('GitHub fetch error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to fetch repository' },
      { status: 500 }
    );
  }
}
