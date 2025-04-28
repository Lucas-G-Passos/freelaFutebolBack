import {
  getByField,
  insertIntoTable,
  getAlunos,
  getEnderecos,
  getPagamentos,
  getResponsaveis,
  getTurmas,
  getInadimplente,
  getAdimplente,
  getInadimplenteNum,
  getNAlunos,
  updateInTable,
  getAniversariantes,
} from "./functions/functions.js";
import express from "express";
import multer from "multer";
import uploadImage from "./../imgKit.js";
const router = express.Router();

router.use(express.json());
router.use(express.urlencoded({ extended: true }));

// Middleware de validação para inserções
const validateInsertData = async (req, res, next) => {
  const { tableName, data } = req.body;

  try {
    if (tableName === "endereco") {
      // Validação do CEP
      const cep = data.cep?.replace(/-/g, "") || "";
      if (!/^\d{8}$/.test(cep)) {
        return res.status(400).json({
          error: "CEP inválido",
          details: "O CEP deve conter 8 dígitos numéricos",
        });
      }

      // Validação do número
      if (!/^\d{1,6}$/.test(data.numero)) {
        return res.status(400).json({
          error: "Número inválido",
          details: "O número deve conter apenas dígitos (1-6 caracteres)",
        });
      }

      // Normaliza os dados
      req.body.data = {
        ...data,
        cep: cep, // Armazena sem hífen
      };
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Alunos
router.get("/aluno", async (req, res) => {
  try {
    const aluno = await getAlunos();
    res.json(aluno || { message: "No Aluno" });
  } catch (error) {
    console.error("error getting aluno:", error);
    res.status(500).json({ error: "Query falha" });
  }
});

// Responsáveis
router.get("/responsavel", async (req, res) => {
  try {
    const responsavel = await getResponsaveis();
    res.json(responsavel || { message: "No Responsavel" });
  } catch (error) {
    console.error("error getting responsavel:", error);
    res.status(500).json({ error: "Query falha" });
  }
});

// Pagamentos
router.get("/pagamento", async (req, res) => {
  try {
    const pagamento = await getPagamentos();
    res.json(pagamento || { message: "No Pagamento" });
  } catch (error) {
    console.error("error getting pagamento:", error);
    res.status(500).json({ error: "Query falha" });
  }
});

// Endereços
router.get("/endereco", async (req, res) => {
  try {
    const endereco = await getEnderecos();
    res.json(endereco || { message: "No Endereco" });
  } catch (error) {
    console.error("error getting endereco:", error);
    res.status(500).json({ error: "Query falha" });
  }
});

// Turmas
router.get("/turmas", async (req, res) => {
  try {
    const turmas = await getTurmas();
    res.json(turmas || { message: "No Turmas" });
  } catch (error) {
    console.error("error getting turmas:", error);
    res.status(500).json({ error: "Query falha" });
  }
});

router.get("/aluno/total", async (req, res) => {
  try {
    const total = await getNAlunos();
    res.json({
      total: total || 0,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch student count",
    });
  }
});

router.get("/aluno/inadimplente", async (req, res) => {
  try {
    const inadimplente = await getInadimplente();
    res.json(inadimplente || { message: "No Inadimplentes" });
  } catch (error) {
    console.error("error getting inadimplentes:", error);
    res.status(500).json({ error: "Query falha" });
  }
});

router.get("/aluno/adimplente", async (req, res) => {
  try {
    const adimplente = await getAdimplente();
    res.json(adimplente || { message: "No adimplente" });
  } catch (error) {
    console.error("error getting adimplentes:", error);
    res.status(500).json({ error: "Query falha" });
  }
});

router.get("/aluno/inadimplente/total", async (req, res) => {
  try {
    const inadimplenteCount = await getInadimplenteNum();
    res.json(inadimplenteCount || { message: "none" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "falha query" });
  }
});

router.post("/aluno/check", async (req, res) => {
  const { field, value } = req.body;

  try {
    const aluno = await getByField("alunos", field, value);
    res.json(aluno || { message: "Aluno não encontrado" });
  } catch (error) {
    console.error("Error fetching aluno:", error);
    res.status(500).json({ error: "Falha na busca" });
  }
});

router.post("/insert", validateInsertData, async (req, res) => {
  const { tableName, data } = req.body;
  console.log("Recebendo dados validados:", req.body);

  try {
    const result = await insertIntoTable(tableName, data);
    res.json({
      success: true,
      id: result.insertId,
      message: `${tableName} inserido com sucesso`,
    });
  } catch (error) {
    console.error(`Erro na inserção (${tableName}):`, error);

    const response = {
      error: "Erro no banco de dados",
      details: error.message,
    };

    if (error.code === "ER_DATA_TOO_LONG") {
      response.details = "Dados excedem o tamanho permitido";
      response.field = error.sqlMessage.match(/column '(.+)'/i)?.[1];
    }

    res.status(500).json(response);
  }
});

router.put("/aluno/update", async (req, res) => {
  const { aluno, endereco, responsavel } = req.body;

  if (!aluno?.id || !endereco?.id) {
    return res.status(400).json({ error: "IDs obrigatórios não fornecidos" });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Validação do CEP
    if (endereco.cep) {
      const cepRaw = endereco.cep.replace(/-/g, "");
      if (!/^\d{8}$/.test(cepRaw)) {
        await conn.rollback();
        return res.status(400).json({
          error: "CEP inválido na atualização",
          details: "O CEP deve conter 8 dígitos numéricos",
        });
      }
      endereco.cep = cepRaw;
    }

    // Atualiza endereço
    await conn.query(
      `UPDATE endereco SET estado = ?, cidade = ?, rua = ?, cep = ? WHERE id = ?`,
      [
        endereco.estado,
        endereco.cidade,
        endereco.rua,
        endereco.cep,
        endereco.id,
      ]
    );

    // Atualiza aluno
    await conn.query(
      `UPDATE alunos SET 
        nome_completo = ?, telefone1 = ?, telefone2 = ?, rg = ?, cpf = ?, convenio = ?,
        alergia = ?, uso_medicamento = ?, medicamento_horario = ?, atestado_medico = ?,
        colegio = ?, colegio_ano = ?, time_coracao = ?, indicacao = ?, observacao = ?,
        ativo = ?, foto = ?, id_turma = ?
      WHERE id = ?`,
      [
        aluno.nome_completo,
        aluno.telefone1,
        aluno.telefone2,
        aluno.rg,
        aluno.cpf,
        aluno.convenio,
        aluno.alergia,
        aluno.uso_medicamento,
        aluno.medicamento_horario,
        aluno.atestado_medico,
        aluno.colegio,
        aluno.colegio_ano,
        aluno.time_coracao,
        aluno.indicacao,
        aluno.observacao,
        aluno.ativo,
        aluno.foto,
        aluno.id_turma,
        aluno.id,
      ]
    );

    // (Opcional) Atualiza responsável, se necessário
    if (responsavel && responsavel.id) {
      await conn.query(
        `UPDATE responsaveis SET nome = ?, cpf = ?, rg = ?, grau_parentesco = ? WHERE id = ?`,
        [
          responsavel.nome,
          responsavel.cpf,
          responsavel.rg,
          responsavel.grau_parentesco,
          responsavel.id,
        ]
      );
    }

    // Commit apenas se todas as operações foram bem-sucedidas
    await conn.commit();

    // Buscar o aluno completo atualizado (JOIN com endereço e responsável)
    const [rows] = await conn.query(
      `SELECT a.*, e.estado, e.cidade, e.rua, e.cep, r.nome AS responsavel_nome, r.cpf AS responsavel_cpf, r.rg AS responsavel_rg, r.grau_parentesco
       FROM alunos a
       JOIN endereco e ON e.id = a.endereco_id
       LEFT JOIN responsaveis r ON r.id = a.responsavel_id
       WHERE a.id = ?`,
      [aluno.id]
    );

    res.json(rows[0]);
  } catch (error) {
    await conn.rollback();
    console.error("Erro ao atualizar aluno:", error);
    res.status(500).json({
      error: "Erro interno do servidor",
      details: error.message,
    });
  } finally {
    conn.release();
  }
});

const upload = multer({ storage: multer.memoryStorage() });

router.post("/aluno/insertimage", upload.single("foto"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "Nenhuma imagem enviada" });
    }

    const fotoUrl = await uploadImage(file); // Usando o serviço que criamos anteriormente
    res.json({ fotoUrl });
  } catch (error) {
    console.error("Erro no upload da imagem:", error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/aluno/aniversariantes", async (req, res) => {
  try {
    const aniversariantes = await getAniversariantes();
    res.json(aniversariantes || { message: "Nenhum aniversariante" });
  } catch (error) {
    console.error("Erro ao buscar Aniversariantes" + error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
