console.log('API KEY:', import.meta.env.VITE_ILOVEPDF_PUBLIC_KEY);
export const ilovepdfService = {
  getToken: async () => {
    const publicKey = import.meta.env.VITE_ILOVEPDF_PUBLIC_KEY;
    if (!publicKey || publicKey === "your_ilovepdf_public_key_here") {
      throw new Error("Please configure a valid VITE_ILOVEPDF_PUBLIC_KEY in your .env file.");
    }

    const res = await fetch("https://api.ilovepdf.com/v1/auth", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ public_key: publicKey })
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(`Auth failed: ${res.statusText} ${JSON.stringify(errorData)}`);
    }

    const data = await res.json();
    return data.token;
  },

  startTask: async (tool, token) => {
    const res = await fetch(`https://api.ilovepdf.com/v1/start/${tool}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!res.ok) {
      throw new Error(`Failed to start task for tool ${tool}`);
    }

    return await res.json(); // { server, task }
  },

  uploadFile: async (server, task, file, token) => {
    const formData = new FormData();
    formData.append("task", task);
    formData.append("file", file);

    const res = await fetch(`https://${server}/v1/upload`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`
      },
      body: formData
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(`Upload failed: ${res.statusText} ${JSON.stringify(errorData)}`);
    }

    const data = await res.json();
    return data.server_filename;
  },

  processTask: async (server, task, tool, files, options, token) => {
    const payload = {
      task,
      tool,
      files,
      ...options
    };

    const res = await fetch(`https://${server}/v1/process`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(`Process failed: ${res.statusText} ${JSON.stringify(errorData)}`);
    }

    return await res.json();
  },

  downloadTask: async (server, task, token) => {
    const res = await fetch(`https://${server}/v1/download/${task}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!res.ok) {
      throw new Error("Download failed");
    }

    return await res.arrayBuffer();
  },

  // Orchestrator method to handle the complete workflow
  runTool: async (tool, fileObjects, processOptions = {}) => {
    const token = await ilovepdfService.getToken();
    const { server, task } = await ilovepdfService.startTask(tool, token);

    const uploadedFiles = [];
    for (const fileObj of fileObjects) {
      const server_filename = await ilovepdfService.uploadFile(server, task, fileObj.file, token);
      uploadedFiles.push({
        server_filename,
        filename: fileObj.file.name,
        ...fileObj.options // like rotate, password
      });
    }

    await ilovepdfService.processTask(server, task, tool, uploadedFiles, processOptions, token);
    
    return await ilovepdfService.downloadTask(server, task, token);
  }
};
