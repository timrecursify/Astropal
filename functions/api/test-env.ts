// Test function to check environment variable access
export interface Env {
  VITE_PUBLIC_ZAPIER_FEEDBACK_URL: string;
}

export const onRequestGet = async (context: { env: Env }) => {
  const { env } = context;
  
  return new Response(JSON.stringify({
    feedback_url_exists: !!env.VITE_PUBLIC_ZAPIER_FEEDBACK_URL,
    feedback_url_value: env.VITE_PUBLIC_ZAPIER_FEEDBACK_URL ? 'configured' : 'not configured',
    all_env_keys: Object.keys(env),
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
};